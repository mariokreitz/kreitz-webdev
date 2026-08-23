import type { RedisConfig } from '@app/config/redis.config';
import { createKeyvNonBlocking } from '@keyv/redis';
import { Cacheable, KeyvCacheableMemory } from 'cacheable';
import type { PinoLogger } from 'nestjs-pino';

import { CacheService } from '../cache.service';

jest.mock('cacheable', () => ({
  Cacheable: jest.fn(),
  KeyvCacheableMemory: jest.fn(),
}));

jest.mock('@keyv/redis', () => ({
  createKeyvNonBlocking: jest.fn(),
}));

interface MockCacheableInstance {
  get: jest.Mock;
  set: jest.Mock;
  delete: jest.Mock;
  disconnect: jest.Mock;
  on: jest.Mock;
}

const mockCacheableInstance: MockCacheableInstance = {
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
};

const mockSecondary: { ttl: number | undefined } = { ttl: undefined };

const mockCacheableCtor = jest.mocked(Cacheable);
const mockKeyvCacheableMemoryCtor = jest.mocked(KeyvCacheableMemory);
const mockCreateKeyvNonBlocking = jest.mocked(createKeyvNonBlocking);

mockCacheableCtor.mockImplementation(() => mockCacheableInstance as unknown as Cacheable);
mockKeyvCacheableMemoryCtor.mockImplementation(() => ({}) as unknown as KeyvCacheableMemory);
mockCreateKeyvNonBlocking.mockImplementation(
  () => mockSecondary as unknown as ReturnType<typeof createKeyvNonBlocking>,
);

function buildLogger(): jest.Mocked<PinoLogger> {
  return {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as jest.Mocked<PinoLogger>;
}

function buildConfig(): RedisConfig {
  return {
    url: 'redis://localhost:6379',
    keyPrefix: 'app',
    commandTimeoutMs: 1_000,
    connectTimeoutMs: 5_000,
    ttlMs: 60_000,
    memoryTtlMs: 10_000,
    memoryLruSize: 1_000,
    queuePrefix: 'app-queue',
  };
}

function buildService(): CacheService {
  return new CacheService(buildConfig(), buildLogger());
}

describe('CacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheableInstance.get.mockResolvedValue(undefined);
    mockSecondary.ttl = undefined;
  });

  describe('construction wiring', () => {
    it('configures the in-memory primary store from redis config', () => {
      buildService();

      expect(mockKeyvCacheableMemoryCtor).toHaveBeenCalledWith({ ttl: 10_000, lruSize: 1_000 });
    });

    it('configures the redis-backed secondary store namespaced by keyPrefix, with its own ttl', () => {
      buildService();

      expect(mockCreateKeyvNonBlocking).toHaveBeenCalledWith('redis://localhost:6379', { namespace: 'app' });
      expect(mockSecondary.ttl).toBe(60_000);
    });

    it('enables non-blocking mode on the Cacheable instance', () => {
      buildService();

      expect(mockCacheableCtor).toHaveBeenCalledWith(expect.objectContaining({ nonBlocking: true }));
    });
  });

  describe('get/set/del', () => {
    it('round-trips a value through the underlying cache', async () => {
      const service = buildService();

      mockCacheableInstance.get.mockResolvedValue({ found: true, value: 'cached-value' });

      const result = await service.get<string>('key-a');

      expect(result).toBe('cached-value');
      expect(mockCacheableInstance.get).toHaveBeenCalledWith('key-a');
    });

    it('returns undefined for a key that was never cached', async () => {
      const service = buildService();

      mockCacheableInstance.get.mockResolvedValue(undefined);

      const result = await service.get<string>('key-missing');

      expect(result).toBeUndefined();
    });

    it('passes the ttl through to the underlying set call', async () => {
      const service = buildService();

      await service.set('key-b', { foo: 'bar' }, 5_000);

      expect(mockCacheableInstance.set).toHaveBeenCalledWith('key-b', { found: true, value: { foo: 'bar' } }, 5_000);
    });

    it('sets without a ttl when none is provided', async () => {
      const service = buildService();

      await service.set('key-c', 'value');

      expect(mockCacheableInstance.set).toHaveBeenCalledWith('key-c', { found: true, value: 'value' }, undefined);
    });

    it('deletes a key from the underlying cache', async () => {
      const service = buildService();

      await service.del('key-d');

      expect(mockCacheableInstance.delete).toHaveBeenCalledWith('key-d');
    });

    it('reads back a value written by set(), and a negative value written by set(null) as null', async () => {
      const service = buildService();

      await service.set('key-shared', 'value', 1_000);
      expect(mockCacheableInstance.set).toHaveBeenLastCalledWith('key-shared', { found: true, value: 'value' }, 1_000);

      mockCacheableInstance.get.mockResolvedValue({ found: true, value: 'value' });
      await expect(service.get<string | null>('key-shared')).resolves.toBe('value');

      await service.set('key-shared', null, 1_000);
      expect(mockCacheableInstance.set).toHaveBeenLastCalledWith('key-shared', { found: false }, 1_000);

      mockCacheableInstance.get.mockResolvedValue({ found: false });
      await expect(service.get<string | null>('key-shared')).resolves.toBeNull();
    });
  });

  describe('getOrSet', () => {
    it('calls the loader and populates the cache on a miss', async () => {
      const service = buildService();
      const loader = jest.fn().mockResolvedValue('fresh-value');

      mockCacheableInstance.get.mockResolvedValue(undefined);

      const result = await service.getOrSet('key-e', 30_000, loader);

      expect(result).toBe('fresh-value');
      expect(loader).toHaveBeenCalledTimes(1);
      expect(mockCacheableInstance.set).toHaveBeenCalledWith('key-e', { found: true, value: 'fresh-value' }, 30_000);
    });

    it('does not call the loader on a cache hit', async () => {
      const service = buildService();
      const loader = jest.fn().mockResolvedValue('should-not-be-used');

      mockCacheableInstance.get.mockResolvedValue({ found: true, value: 'hit-value' });

      const result = await service.getOrSet('key-f', 30_000, loader);

      expect(result).toBe('hit-value');
      expect(loader).not.toHaveBeenCalled();
      expect(mockCacheableInstance.set).not.toHaveBeenCalled();
    });

    it('passes the ttl through to the underlying set call on a miss', async () => {
      const service = buildService();
      const loader = jest.fn().mockResolvedValue('value-with-ttl');

      mockCacheableInstance.get.mockResolvedValue(undefined);

      await service.getOrSet('key-g', 12_345, loader);

      expect(mockCacheableInstance.set).toHaveBeenCalledWith('key-g', { found: true, value: 'value-with-ttl' }, 12_345);
    });

    describe('negative caching', () => {
      it('caches a null loader result as a negative hit and does not re-invoke the loader on the next call', async () => {
        const service = buildService();
        const loader = jest.fn().mockResolvedValue(null);

        mockCacheableInstance.get.mockResolvedValueOnce(undefined);

        const firstResult = await service.getOrSet<string | null>('key-h', 30_000, loader);

        expect(firstResult).toBeNull();
        expect(loader).toHaveBeenCalledTimes(1);
        expect(mockCacheableInstance.set).toHaveBeenCalledWith('key-h', { found: false }, 30_000);

        mockCacheableInstance.get.mockResolvedValueOnce({ found: false });

        const secondResult = await service.getOrSet<string | null>('key-h', 30_000, loader);

        expect(secondResult).toBeNull();
        expect(loader).toHaveBeenCalledTimes(1);
      });

      it('resolves a negative hit written by getOrSet when read back through the plain get() API', async () => {
        const service = buildService();

        mockCacheableInstance.get.mockResolvedValue({ found: false });

        await expect(service.get<string | null>('key-i')).resolves.toBeNull();
      });
    });
  });
});
