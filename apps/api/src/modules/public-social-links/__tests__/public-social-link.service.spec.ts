import type { RedisConfig } from '@app/config/redis.config';
import type { CacheService } from '@app/database/cache';
import type { IPublicSocialLinkRepository } from '@app/database/interfaces/public-social-link.repository.interface';
import type { PublicSocialLinkRecord } from '@app/database/types/public-social-link.types';
import { buildWebsiteSocialLinksCacheKey } from '@app/modules/social-link';
import type { PinoLogger } from 'nestjs-pino';

import { PublicSocialLinkService } from '../public-social-link.service';

interface MockedCacheService {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  getOrSet: jest.Mock;
}

function buildRepository(records: PublicSocialLinkRecord[]): IPublicSocialLinkRepository {
  return {
    findManyByWebsiteId: jest.fn().mockResolvedValue(records),
  };
}

interface MockedLogger {
  setContext: jest.Mock;
  info: jest.Mock;
}

function buildLogger(): MockedLogger {
  return {
    setContext: jest.fn(),
    info: jest.fn(),
  };
}

function buildRedisConfig(overrides: Partial<RedisConfig> = {}): RedisConfig {
  return {
    url: 'redis://localhost:6379',
    keyPrefix: 'app',
    commandTimeoutMs: 1_000,
    connectTimeoutMs: 5_000,
    ttlMs: 60_000,
    memoryTtlMs: 10_000,
    memoryLruSize: 1_000,
    queuePrefix: 'app-queue',
    ...overrides,
  };
}

function buildCacheService(): { cacheService: MockedCacheService; store: Map<string, unknown> } {
  const store = new Map<string, unknown>();

  const cacheService: MockedCacheService = {
    get: jest.fn((key: string) => store.get(key)),
    set: jest.fn((key: string, value: unknown) => {
      store.set(key, value);
    }),
    del: jest.fn((key: string) => {
      store.delete(key);
    }),
    getOrSet: jest.fn(async (key: string, _ttlMs: number | undefined, loader: () => Promise<unknown>) => {
      if (store.has(key)) {
        return store.get(key);
      }

      const value = await loader();
      store.set(key, value);

      return value;
    }),
  };

  return { cacheService, store };
}

function firstOf<T>(items: readonly T[]): T {
  const [item] = items;

  if (item === undefined) {
    throw new Error('Expected at least one item');
  }

  return item;
}

const record: PublicSocialLinkRecord = {
  id: 'social-link-1',
  platform: 'github',
  label: 'GitHub',
  url: 'https://github.com/mariokreitz',
  sortOrder: 0,
};

function buildService(records: PublicSocialLinkRecord[] = [record]): {
  service: PublicSocialLinkService;
  repository: IPublicSocialLinkRepository;
  cacheService: MockedCacheService;
  logger: MockedLogger;
} {
  const repository = buildRepository(records);
  const { cacheService } = buildCacheService();
  const logger = buildLogger();
  const service = new PublicSocialLinkService(
    repository,
    cacheService as unknown as CacheService,
    buildRedisConfig(),
    logger as unknown as PinoLogger,
  );

  return { service, repository, cacheService, logger };
}

describe('PublicSocialLinkService', () => {
  describe('getSocialLinks', () => {
    it('returns the website social links in the documented public shape with exactly id, platform, label, url, and sortOrder', async () => {
      const { service } = buildService([record]);

      const result = await service.getSocialLinks('website-1');

      expect(result).toEqual([record]);
      expect(Object.keys(firstOf(result))).toEqual(['id', 'platform', 'label', 'url', 'sortOrder']);
    });

    it('queries the repository with exactly the given websiteId, so no code path can return another website data', async () => {
      const { service, repository } = buildService([]);

      await service.getSocialLinks('website-a');

      expect(repository.findManyByWebsiteId).toHaveBeenCalledTimes(1);
      expect(repository.findManyByWebsiteId).toHaveBeenCalledWith('website-a');
    });

    it('never calls the repository with a websiteId other than the one it received', async () => {
      const { service, repository } = buildService([]);

      await service.getSocialLinks('website-b');

      expect(repository.findManyByWebsiteId).not.toHaveBeenCalledWith('website-a');
    });

    it('returns an empty array when the website has no social links, so the caller can render nothing', async () => {
      const { service } = buildService([]);

      const result = await service.getSocialLinks('website-c');

      expect(result).toEqual([]);
    });

    it('logs an info event with the websiteId and the returned social link count, never the social link data itself', async () => {
      const { service, logger } = buildService([record]);

      await service.getSocialLinks('website-1');

      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith({
        event: 'public_social_link.listed',
        websiteId: 'website-1',
        count: 1,
      });
    });

    describe('caching', () => {
      it('populates the cache under the website:{id}:social-links key on the first read', async () => {
        const { service, cacheService } = buildService([record]);

        await service.getSocialLinks('website-1');

        expect(cacheService.getOrSet).toHaveBeenCalledWith(
          buildWebsiteSocialLinksCacheKey('website-1'),
          60_000,
          expect.any(Function),
        );
      });

      it('skips the repository call on a cache hit for a second read of the same website', async () => {
        const { service, repository } = buildService([record]);

        await service.getSocialLinks('website-1');
        await service.getSocialLinks('website-1');

        expect(repository.findManyByWebsiteId).toHaveBeenCalledTimes(1);
      });

      it('re-fetches from the repository after the cache entry is deleted', async () => {
        const { service, repository, cacheService } = buildService([record]);

        await service.getSocialLinks('website-1');
        await cacheService.del(buildWebsiteSocialLinksCacheKey('website-1'));
        await service.getSocialLinks('website-1');

        expect(repository.findManyByWebsiteId).toHaveBeenCalledTimes(2);
      });

      it('caches each website under its own independent key', async () => {
        const { service, repository } = buildService([record]);

        await service.getSocialLinks('website-1');
        await service.getSocialLinks('website-2');

        expect(repository.findManyByWebsiteId).toHaveBeenCalledTimes(2);
        expect(repository.findManyByWebsiteId).toHaveBeenCalledWith('website-1');
        expect(repository.findManyByWebsiteId).toHaveBeenCalledWith('website-2');
      });
    });
  });
});
