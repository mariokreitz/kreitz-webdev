import type { RedisConfig } from '@app/config/redis.config';
import type { CacheService } from '@app/database/cache';
import type { IPublicProjectRepository } from '@app/database/interfaces/public-project.repository.interface';
import type { PublicProjectRecord } from '@app/database/types/public-project.types';
import { buildWebsiteProjectsCacheKey } from '@app/modules/website-project';
import type { PinoLogger } from 'nestjs-pino';

import { PublicProjectService } from '../public-project.service';

interface MockedCacheService {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  getOrSet: jest.Mock;
}

function buildRepository(records: PublicProjectRecord[]): IPublicProjectRepository {
  return {
    findPublishedByWebsiteId: jest.fn().mockResolvedValue(records),
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

// WHY: a real map-backed fake (not a bare jest.fn) is needed to actually exercise "hit skips the loader" and "del makes the next read refetch" behavior, not just that getOrSet was called with the right arguments.
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

const record: PublicProjectRecord = {
  id: 'project-1',
  name: 'My awesome project',
  description: 'A project description',
  repoUrl: 'https://github.com/mariokreitz/my-project',
  liveUrl: 'https://myproject.dev',
  tags: ['Angular', 'NestJS'],
  imageUrl: 'https://example.com/project.png',
};

function buildService(records: PublicProjectRecord[] = [record]): {
  service: PublicProjectService;
  repository: IPublicProjectRepository;
  cacheService: MockedCacheService;
  logger: MockedLogger;
} {
  const repository = buildRepository(records);
  const { cacheService } = buildCacheService();
  const logger = buildLogger();
  const service = new PublicProjectService(
    repository,
    cacheService as unknown as CacheService,
    buildRedisConfig(),
    logger as unknown as PinoLogger,
  );

  return { service, repository, cacheService, logger };
}

describe('PublicProjectService', () => {
  describe('getPublishedProjects', () => {
    it('returns the website projects in the documented public shape with exactly id, name, description, repoUrl, liveUrl, tags, and imageUrl', async () => {
      const { service } = buildService([record]);

      const result = await service.getPublishedProjects('website-1');

      expect(result).toEqual([
        {
          id: 'project-1',
          name: 'My awesome project',
          description: 'A project description',
          repoUrl: 'https://github.com/mariokreitz/my-project',
          liveUrl: 'https://myproject.dev',
          tags: ['Angular', 'NestJS'],
          imageUrl: 'https://example.com/project.png',
        },
      ]);
      expect(Object.keys(firstOf(result))).toEqual([
        'id',
        'name',
        'description',
        'repoUrl',
        'liveUrl',
        'tags',
        'imageUrl',
      ]);
    });

    it('does not include githubOwner, githubRepo, sortOrder, or any other internal field in the returned projects', async () => {
      const { service } = buildService([record]);

      const result = await service.getPublishedProjects('website-1');

      expect(Object.keys(firstOf(result))).not.toContain('githubOwner');
      expect(Object.keys(firstOf(result))).not.toContain('githubRepo');
      expect(Object.keys(firstOf(result))).not.toContain('sortOrder');
    });

    it('queries the repository with exactly the given websiteId, so no code path can return another website data', async () => {
      const { service, repository } = buildService([]);

      await service.getPublishedProjects('website-a');

      expect(repository.findPublishedByWebsiteId).toHaveBeenCalledTimes(1);
      expect(repository.findPublishedByWebsiteId).toHaveBeenCalledWith('website-a');
    });

    it('never calls the repository with a websiteId other than the one it received', async () => {
      const { service, repository } = buildService([]);

      await service.getPublishedProjects('website-b');

      expect(repository.findPublishedByWebsiteId).not.toHaveBeenCalledWith('website-a');
    });

    it('returns an empty array as-is, relying on the repository to have already excluded unpublished projects', async () => {
      const { service } = buildService([]);

      const result = await service.getPublishedProjects('website-c');

      expect(result).toEqual([]);
    });

    it('maps only the 7 allow-listed fields even when the underlying record carries extra internal fields, guarding against a newly-added sensitive field silently leaking', async () => {
      const leakyRecord = {
        ...record,
        githubOwner: 'mariokreitz',
        githubRepo: 'my-project',
        sortOrder: 3,
        internalNotes: 'never expose this',
      } as PublicProjectRecord;
      const { service } = buildService([leakyRecord]);

      const result = await service.getPublishedProjects('website-1');

      const mapped = firstOf(result);

      expect(Object.keys(mapped)).toEqual(['id', 'name', 'description', 'repoUrl', 'liveUrl', 'tags', 'imageUrl']);
      expect(mapped).not.toHaveProperty('githubOwner');
      expect(mapped).not.toHaveProperty('githubRepo');
      expect(mapped).not.toHaveProperty('sortOrder');
      expect(mapped).not.toHaveProperty('internalNotes');
    });

    it('logs an info event with the websiteId and the returned project count, never the project data itself', async () => {
      const { service, logger } = buildService([record]);

      await service.getPublishedProjects('website-1');

      expect(logger.info).toHaveBeenCalledTimes(1);
      expect(logger.info).toHaveBeenCalledWith({
        event: 'public_project.listed',
        websiteId: 'website-1',
        count: 1,
      });
    });

    describe('caching', () => {
      it('populates the cache under the website:{id}:projects key on the first read', async () => {
        const { service, cacheService } = buildService([record]);

        await service.getPublishedProjects('website-1');

        expect(cacheService.getOrSet).toHaveBeenCalledWith(
          buildWebsiteProjectsCacheKey('website-1'),
          60_000,
          expect.any(Function),
        );
      });

      it('skips the repository call on a cache hit for a second read of the same website', async () => {
        const { service, repository } = buildService([record]);

        await service.getPublishedProjects('website-1');
        await service.getPublishedProjects('website-1');

        expect(repository.findPublishedByWebsiteId).toHaveBeenCalledTimes(1);
      });

      it('re-fetches from the repository after the cache entry is deleted', async () => {
        const { service, repository, cacheService } = buildService([record]);

        await service.getPublishedProjects('website-1');
        await cacheService.del(buildWebsiteProjectsCacheKey('website-1'));
        await service.getPublishedProjects('website-1');

        expect(repository.findPublishedByWebsiteId).toHaveBeenCalledTimes(2);
      });

      it('caches each website under its own independent key', async () => {
        const { service, repository } = buildService([record]);

        await service.getPublishedProjects('website-1');
        await service.getPublishedProjects('website-2');

        expect(repository.findPublishedByWebsiteId).toHaveBeenCalledTimes(2);
        expect(repository.findPublishedByWebsiteId).toHaveBeenCalledWith('website-1');
        expect(repository.findPublishedByWebsiteId).toHaveBeenCalledWith('website-2');
      });
    });
  });
});
