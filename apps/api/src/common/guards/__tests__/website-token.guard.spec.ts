import type { RedisConfig } from '@app/config/redis.config';
import type { CacheService } from '@app/database/cache';
import type { IWebsiteDomainRepository } from '@app/database/interfaces/website-domain.repository.interface';
import type { IWebsiteTokenRepository } from '@app/database/interfaces/website-token.repository.interface';
import type { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';
import type { WebsiteDomainRecord } from '@app/database/types/website-domain.types';
import type { WebsiteTokenRecord } from '@app/database/types/website-token.types';
import type { WebsiteRecord } from '@app/database/types/website.repository.types';
import { ForbiddenException, UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { PinoLogger } from 'nestjs-pino';
import { createHash } from 'node:crypto';

import { WebsiteTokenGuard } from '../website-token.guard';

const RAW_TOKEN = 'wst_live_test-raw-token-value';
const TOKEN_HASH = createHash('sha256').update(RAW_TOKEN, 'utf8').digest('hex');
const NOW = new Date('2026-01-01T00:00:00.000Z');
const TTL_MS = 60_000;

function buildToken(overrides: Partial<WebsiteTokenRecord> = {}): WebsiteTokenRecord {
  return {
    id: 'token-a',
    websiteId: 'website-a',
    name: 'Production Token',
    prefix: 'wst_live_aaaaaaaa',
    tokenHash: TOKEN_HASH,
    expiresAt: null,
    lastUsedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildWebsite(overrides: Partial<WebsiteRecord> = {}): WebsiteRecord {
  return {
    id: 'website-a',
    userId: 'user-a',
    name: 'Website A',
    slug: 'website-a',
    enabled: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildDomain(overrides: Partial<WebsiteDomainRecord> = {}): WebsiteDomainRecord {
  return {
    id: 'domain-a',
    websiteId: 'website-a',
    domain: 'mario.dev',
    verified: true,
    verifiedAt: NOW,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildRequest(overrides: Record<string, unknown> = {}): Request {
  return {
    headers: {},
    query: {},
    body: {},
    ...overrides,
  } as unknown as Request;
}

function buildContext(request: Request): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

interface MockedPinoLogger {
  setContext: jest.Mock;
  trace: jest.Mock;
  debug: jest.Mock;
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
  fatal: jest.Mock;
  assign: jest.Mock;
}

function buildLogger(): MockedPinoLogger {
  return {
    setContext: jest.fn(),
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    assign: jest.fn(),
  };
}

interface MockedCacheService {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  getOrSet: jest.Mock;
}

function buildCacheService(): MockedCacheService {
  const cacheService: MockedCacheService = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
  };

  // WHY: default behavior passes through to the loader, so existing tests that mock repositories directly keep working unless a test overrides getOrSet to assert cache-hit/negative-cache behavior.
  cacheService.getOrSet.mockImplementation(
    async (_key: string, _ttlMs: number | undefined, loader: () => Promise<unknown>) => loader(),
  );

  return cacheService;
}

function buildRedisConfig(overrides: Partial<RedisConfig> = {}): RedisConfig {
  return {
    url: 'redis://localhost:6379',
    keyPrefix: 'app',
    commandTimeoutMs: 1_000,
    connectTimeoutMs: 5_000,
    ttlMs: TTL_MS,
    memoryTtlMs: 10_000,
    memoryLruSize: 1_000,
    queuePrefix: 'app-queue',
    ...overrides,
  };
}

function buildGuard(): {
  guard: WebsiteTokenGuard;
  websiteTokenRepository: jest.Mocked<IWebsiteTokenRepository>;
  websiteDomainRepository: jest.Mocked<IWebsiteDomainRepository>;
  websiteRepository: jest.Mocked<IWebsiteRepository>;
  cacheService: MockedCacheService;
  logger: MockedPinoLogger;
} {
  const websiteTokenRepository: jest.Mocked<IWebsiteTokenRepository> = {
    findByTokenHash: jest.fn(),
    findManyByWebsiteId: jest.fn(),
    findByIdAndWebsiteId: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    updateLastUsedAt: jest.fn(),
  };

  const websiteDomainRepository: jest.Mocked<IWebsiteDomainRepository> = {
    findManyByWebsiteId: jest.fn(),
    findByIdAndWebsiteId: jest.fn(),
    findByDomain: jest.fn(),
    findVerifiedByDomain: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const websiteRepository: jest.Mocked<IWebsiteRepository> = {
    findById: jest.fn(),
    findByIdAndUserId: jest.fn(),
    findBySlug: jest.fn(),
    findByDomain: jest.fn(),
    findManyByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  websiteTokenRepository.updateLastUsedAt.mockResolvedValue(undefined);

  const cacheService = buildCacheService();
  const redis = buildRedisConfig();
  const logger = buildLogger();

  const guard = new WebsiteTokenGuard(
    websiteTokenRepository,
    websiteDomainRepository,
    websiteRepository,
    redis,
    cacheService as unknown as CacheService,
    logger as unknown as PinoLogger,
  );

  return { guard, websiteTokenRepository, websiteDomainRepository, websiteRepository, cacheService, logger };
}

describe('WebsiteTokenGuard', () => {
  it('resolves a valid, active, non-expired token for an enabled website and attaches its websiteId', async () => {
    const { guard, websiteTokenRepository, websiteRepository } = buildGuard();

    websiteTokenRepository.findByTokenHash.mockResolvedValue(buildToken());
    websiteRepository.findById.mockResolvedValue(buildWebsite());

    const request = buildRequest({ headers: { authorization: `Bearer ${RAW_TOKEN}` } });
    const context = buildContext(request);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.websiteId).toBe('website-a');
    expect(request.websiteTokenId).toBe('token-a');
    expect(websiteTokenRepository.updateLastUsedAt).toHaveBeenCalledWith('token-a', expect.any(Date));
  });

  it('ignores a spoofed websiteId in query/body and attaches only the websiteId resolved from the token', async () => {
    const { guard, websiteTokenRepository, websiteRepository } = buildGuard();

    websiteTokenRepository.findByTokenHash.mockResolvedValue(buildToken({ id: 'token-a', websiteId: 'website-a' }));
    websiteRepository.findById.mockResolvedValue(buildWebsite({ id: 'website-a' }));

    const request = buildRequest({
      headers: { authorization: `Bearer ${RAW_TOKEN}` },
      query: { websiteId: 'website-spoofed', userId: 'user-spoofed' },
      body: { websiteId: 'website-spoofed', userId: 'user-spoofed' },
    });
    const context = buildContext(request);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.websiteId).toBe('website-a');
    expect(request.websiteId).not.toBe('website-spoofed');
  });

  it('resolves strictly to the token-owning website, never to another website present in the mock data', async () => {
    const { guard, websiteTokenRepository, websiteRepository } = buildGuard();

    websiteTokenRepository.findByTokenHash.mockResolvedValue(buildToken({ id: 'token-a', websiteId: 'website-a' }));
    websiteRepository.findById.mockImplementation(async (id) => {
      await Promise.resolve();

      if (id === 'website-a') {
        return buildWebsite({ id: 'website-a' });
      }

      if (id === 'website-b') {
        return buildWebsite({ id: 'website-b' });
      }

      return null;
    });

    const request = buildRequest({ headers: { authorization: `Bearer ${RAW_TOKEN}` } });
    const context = buildContext(request);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(request.websiteId).toBe('website-a');
    expect(websiteRepository.findById).toHaveBeenCalledWith('website-a');
    expect(websiteRepository.findById).not.toHaveBeenCalledWith('website-b');
  });

  it('rejects a token whose expiresAt is in the past', async () => {
    const { guard, websiteTokenRepository, logger } = buildGuard();

    websiteTokenRepository.findByTokenHash.mockResolvedValue(
      buildToken({ expiresAt: new Date('2020-01-01T00:00:00.000Z') }),
    );

    const request = buildRequest({ headers: { authorization: `Bearer ${RAW_TOKEN}` } });
    const context = buildContext(request);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'website_token.guard.rejected',
        reason: 'expired_token',
        websiteId: 'website-a',
        tokenId: 'token-a',
      }),
    );
  });

  it('rejects a token whose website record no longer exists', async () => {
    const { guard, websiteTokenRepository, websiteRepository, logger } = buildGuard();

    websiteTokenRepository.findByTokenHash.mockResolvedValue(buildToken());
    websiteRepository.findById.mockResolvedValue(null);

    const request = buildRequest({ headers: { authorization: `Bearer ${RAW_TOKEN}` } });
    const context = buildContext(request);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'website_token.guard.rejected',
        reason: 'website_not_found',
        websiteId: 'website-a',
        tokenId: 'token-a',
      }),
    );
  });

  it('rejects a valid, active token when its website is disabled', async () => {
    const { guard, websiteTokenRepository, websiteRepository, logger } = buildGuard();

    websiteTokenRepository.findByTokenHash.mockResolvedValue(buildToken());
    websiteRepository.findById.mockResolvedValue(buildWebsite({ enabled: false }));

    const request = buildRequest({ headers: { authorization: `Bearer ${RAW_TOKEN}` } });
    const context = buildContext(request);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'website_token.guard.rejected',
        reason: 'website_disabled',
        websiteId: 'website-a',
        tokenId: 'token-a',
      }),
    );
  });

  it('rejects the request when the Authorization header is missing entirely', async () => {
    const { guard, logger } = buildGuard();

    const request = buildRequest({ ip: '203.0.113.10' });
    const context = buildContext(request);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'website_token.guard.rejected',
        reason: 'missing_token',
        ip: '203.0.113.10',
      }),
    );
  });

  it('rejects a well-formed bearer token that does not match any stored token hash', async () => {
    const { guard, websiteTokenRepository, logger } = buildGuard();

    websiteTokenRepository.findByTokenHash.mockResolvedValue(null);

    const request = buildRequest({
      headers: { authorization: 'Bearer garbage-not-a-real-token' },
      ip: '203.0.113.10',
    });
    const context = buildContext(request);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(websiteTokenRepository.findByTokenHash).toHaveBeenCalledWith(
      createHash('sha256').update('garbage-not-a-real-token', 'utf8').digest('hex'),
    );
    expect(logger.warn).toHaveBeenCalledWith({
      event: 'website_token.guard.rejected',
      reason: 'invalid_token',
      ip: '203.0.113.10',
    });
  });

  it('allows the request when the Origin header matches a verified domain for the token’s website', async () => {
    const { guard, websiteTokenRepository, websiteRepository, websiteDomainRepository } = buildGuard();

    websiteTokenRepository.findByTokenHash.mockResolvedValue(buildToken());
    websiteRepository.findById.mockResolvedValue(buildWebsite());
    websiteDomainRepository.findVerifiedByDomain.mockResolvedValue(buildDomain());

    const request = buildRequest({
      headers: { authorization: `Bearer ${RAW_TOKEN}`, origin: 'https://mario.dev' },
    });
    const context = buildContext(request);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(websiteDomainRepository.findVerifiedByDomain).toHaveBeenCalledWith('mario.dev');
  });

  it('rejects the request when the Origin header does not match any verified domain for the website', async () => {
    const { guard, websiteTokenRepository, websiteRepository, websiteDomainRepository, logger } = buildGuard();

    websiteTokenRepository.findByTokenHash.mockResolvedValue(buildToken());
    websiteRepository.findById.mockResolvedValue(buildWebsite());
    websiteDomainRepository.findVerifiedByDomain.mockResolvedValue(null);

    const request = buildRequest({
      headers: { authorization: `Bearer ${RAW_TOKEN}`, origin: 'https://evil.example' },
    });
    const context = buildContext(request);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'website_token.guard.rejected',
        reason: 'origin_unverified',
        websiteId: 'website-a',
        tokenId: 'token-a',
      }),
    );
  });

  it('rejects the request when the Origin header is malformed', async () => {
    const { guard, websiteTokenRepository, websiteRepository, logger } = buildGuard();

    websiteTokenRepository.findByTokenHash.mockResolvedValue(buildToken());
    websiteRepository.findById.mockResolvedValue(buildWebsite());

    const request = buildRequest({
      headers: { authorization: `Bearer ${RAW_TOKEN}`, origin: 'not-a-valid-origin' },
    });
    const context = buildContext(request);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'website_token.guard.rejected',
        reason: 'origin_invalid',
        websiteId: 'website-a',
        tokenId: 'token-a',
      }),
    );
  });

  it('rejects the request when the Origin header resolves to a domain verified for a different website', async () => {
    const { guard, websiteTokenRepository, websiteRepository, websiteDomainRepository, logger } = buildGuard();

    websiteTokenRepository.findByTokenHash.mockResolvedValue(buildToken({ websiteId: 'website-a' }));
    websiteRepository.findById.mockResolvedValue(buildWebsite({ id: 'website-a' }));
    websiteDomainRepository.findVerifiedByDomain.mockResolvedValue(buildDomain({ websiteId: 'website-b' }));

    const request = buildRequest({
      headers: { authorization: `Bearer ${RAW_TOKEN}`, origin: 'https://mario.dev' },
    });
    const context = buildContext(request);

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'website_token.guard.rejected',
        reason: 'origin_mismatch',
        websiteId: 'website-a',
        tokenId: 'token-a',
      }),
    );
  });

  it('allows a server-to-server request that carries no Origin header at all', async () => {
    const { guard, websiteTokenRepository, websiteRepository, websiteDomainRepository } = buildGuard();

    websiteTokenRepository.findByTokenHash.mockResolvedValue(buildToken());
    websiteRepository.findById.mockResolvedValue(buildWebsite());

    const request = buildRequest({ headers: { authorization: `Bearer ${RAW_TOKEN}` } });
    const context = buildContext(request);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(websiteDomainRepository.findVerifiedByDomain).not.toHaveBeenCalled();
  });

  describe('caching', () => {
    it('looks up the token through the cache using the token-hash key and the configured L2 ttl', async () => {
      const { guard, websiteTokenRepository, websiteRepository, cacheService } = buildGuard();

      websiteTokenRepository.findByTokenHash.mockResolvedValue(buildToken());
      websiteRepository.findById.mockResolvedValue(buildWebsite());

      const request = buildRequest({ headers: { authorization: `Bearer ${RAW_TOKEN}` } });
      const context = buildContext(request);

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(cacheService.getOrSet).toHaveBeenCalledWith(`token:${TOKEN_HASH}`, TTL_MS, expect.any(Function));
    });

    it('resolves a cache hit without querying the token repository', async () => {
      const { guard, websiteTokenRepository, websiteRepository, cacheService } = buildGuard();

      cacheService.getOrSet.mockImplementation((key: string) => {
        if (key === `token:${TOKEN_HASH}`) {
          return buildToken();
        }

        return buildWebsite();
      });

      const request = buildRequest({ headers: { authorization: `Bearer ${RAW_TOKEN}` } });
      const context = buildContext(request);

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(websiteTokenRepository.findByTokenHash).not.toHaveBeenCalled();
      expect(websiteRepository.findById).not.toHaveBeenCalled();
    });

    it('rejects a negative-cached token without re-querying the token repository', async () => {
      const { guard, websiteTokenRepository, cacheService, logger } = buildGuard();

      cacheService.getOrSet.mockResolvedValue(null);

      const request = buildRequest({
        headers: { authorization: `Bearer ${RAW_TOKEN}` },
        ip: '203.0.113.10',
      });
      const context = buildContext(request);

      await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(websiteTokenRepository.findByTokenHash).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith({
        event: 'website_token.guard.rejected',
        reason: 'invalid_token',
        ip: '203.0.113.10',
      });
    });

    it('looks up the website through the cache using the website-id key and the configured L2 ttl', async () => {
      const { guard, websiteTokenRepository, websiteRepository, cacheService } = buildGuard();

      websiteTokenRepository.findByTokenHash.mockResolvedValue(buildToken());
      websiteRepository.findById.mockResolvedValue(buildWebsite());

      const request = buildRequest({ headers: { authorization: `Bearer ${RAW_TOKEN}` } });
      const context = buildContext(request);

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(cacheService.getOrSet).toHaveBeenCalledWith('website:website-a', TTL_MS, expect.any(Function));
    });

    it('normalizes a token record whose dates were serialized to strings by the redis cache layer', async () => {
      const { guard, websiteRepository, cacheService } = buildGuard();

      const serializedToken = {
        ...buildToken({ lastUsedAt: null }),
        expiresAt: new Date('2027-01-01T00:00:00.000Z').toISOString(),
      } as unknown as WebsiteTokenRecord;

      cacheService.getOrSet.mockImplementation((key: string) => {
        if (key === `token:${TOKEN_HASH}`) {
          return serializedToken;
        }

        return buildWebsite();
      });
      websiteRepository.findById.mockResolvedValue(buildWebsite());

      const request = buildRequest({ headers: { authorization: `Bearer ${RAW_TOKEN}` } });
      const context = buildContext(request);

      await expect(guard.canActivate(context)).resolves.toBe(true);
    });
  });

  describe('lastUsedAt debounce', () => {
    it('writes updateLastUsedAt when the token has never been used', async () => {
      const { guard, websiteTokenRepository, websiteRepository } = buildGuard();

      websiteTokenRepository.findByTokenHash.mockResolvedValue(buildToken({ lastUsedAt: null }));
      websiteRepository.findById.mockResolvedValue(buildWebsite());

      const request = buildRequest({ headers: { authorization: `Bearer ${RAW_TOKEN}` } });
      const context = buildContext(request);

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(websiteTokenRepository.updateLastUsedAt).toHaveBeenCalledWith('token-a', expect.any(Date));
    });

    it('refreshes the cached token record with the new lastUsedAt after a debounce-triggered write, so the next request within the ttl does not re-trigger it', async () => {
      const { guard, websiteTokenRepository, websiteRepository, cacheService } = buildGuard();

      const token = buildToken({ lastUsedAt: null });
      websiteTokenRepository.findByTokenHash.mockResolvedValue(token);
      websiteRepository.findById.mockResolvedValue(buildWebsite());

      const request = buildRequest({ headers: { authorization: `Bearer ${RAW_TOKEN}` } });
      const context = buildContext(request);

      await expect(guard.canActivate(context)).resolves.toBe(true);

      expect(cacheService.set).toHaveBeenCalledWith(
        `token:${TOKEN_HASH}`,
        expect.objectContaining({ ...token, lastUsedAt: expect.any(Date) as Date }),
        TTL_MS,
      );

      const [, refreshedToken] = cacheService.set.mock.calls[0] as [string, WebsiteTokenRecord, number | undefined];

      cacheService.getOrSet.mockImplementation((key: string) => {
        if (key === `token:${TOKEN_HASH}`) {
          return refreshedToken;
        }

        return buildWebsite();
      });
      websiteTokenRepository.updateLastUsedAt.mockClear();

      await expect(guard.canActivate(context)).resolves.toBe(true);
      expect(websiteTokenRepository.updateLastUsedAt).not.toHaveBeenCalled();
    });

    it('writes updateLastUsedAt when the existing lastUsedAt is older than the debounce threshold', async () => {
      const { guard, websiteTokenRepository, websiteRepository } = buildGuard();

      jest.useFakeTimers().setSystemTime(NOW);

      const staleLastUsedAt = new Date(NOW.getTime() - 6 * 60 * 1000);
      websiteTokenRepository.findByTokenHash.mockResolvedValue(buildToken({ lastUsedAt: staleLastUsedAt }));
      websiteRepository.findById.mockResolvedValue(buildWebsite());

      const request = buildRequest({ headers: { authorization: `Bearer ${RAW_TOKEN}` } });
      const context = buildContext(request);

      try {
        await expect(guard.canActivate(context)).resolves.toBe(true);
        expect(websiteTokenRepository.updateLastUsedAt).toHaveBeenCalledWith('token-a', expect.any(Date));
      } finally {
        jest.useRealTimers();
      }
    });

    it('skips the updateLastUsedAt write when the token was used within the debounce window', async () => {
      const { guard, websiteTokenRepository, websiteRepository } = buildGuard();

      jest.useFakeTimers().setSystemTime(NOW);

      const recentLastUsedAt = new Date(NOW.getTime() - 60 * 1000);
      websiteTokenRepository.findByTokenHash.mockResolvedValue(buildToken({ lastUsedAt: recentLastUsedAt }));
      websiteRepository.findById.mockResolvedValue(buildWebsite());

      const request = buildRequest({ headers: { authorization: `Bearer ${RAW_TOKEN}` } });
      const context = buildContext(request);

      try {
        await expect(guard.canActivate(context)).resolves.toBe(true);
        expect(websiteTokenRepository.updateLastUsedAt).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });

    it('treats a cache-serialized string lastUsedAt the same as a Date instance', async () => {
      const { guard, websiteRepository, cacheService, websiteTokenRepository } = buildGuard();

      jest.useFakeTimers().setSystemTime(NOW);

      const recentLastUsedAt = new Date(NOW.getTime() - 60 * 1000);
      const serializedToken = {
        ...buildToken(),
        lastUsedAt: recentLastUsedAt.toISOString(),
      } as unknown as WebsiteTokenRecord;

      cacheService.getOrSet.mockImplementation((key: string) => {
        if (key === `token:${TOKEN_HASH}`) {
          return serializedToken;
        }

        return buildWebsite();
      });
      websiteRepository.findById.mockResolvedValue(buildWebsite());

      const request = buildRequest({ headers: { authorization: `Bearer ${RAW_TOKEN}` } });
      const context = buildContext(request);

      try {
        await expect(guard.canActivate(context)).resolves.toBe(true);
        expect(websiteTokenRepository.updateLastUsedAt).not.toHaveBeenCalled();
      } finally {
        jest.useRealTimers();
      }
    });
  });
});
