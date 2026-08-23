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

function buildGuard(): {
  guard: WebsiteTokenGuard;
  websiteTokenRepository: jest.Mocked<IWebsiteTokenRepository>;
  websiteDomainRepository: jest.Mocked<IWebsiteDomainRepository>;
  websiteRepository: jest.Mocked<IWebsiteRepository>;
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

  const logger = buildLogger();

  const guard = new WebsiteTokenGuard(
    websiteTokenRepository,
    websiteDomainRepository,
    websiteRepository,
    logger as unknown as PinoLogger,
  );

  return { guard, websiteTokenRepository, websiteDomainRepository, websiteRepository, logger };
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
});
