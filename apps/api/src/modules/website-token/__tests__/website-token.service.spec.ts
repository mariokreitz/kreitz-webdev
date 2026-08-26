import type { CacheService } from '@app/database/cache';
import type { IWebsiteTokenRepository } from '@app/database/interfaces/website-token.repository.interface';
import type { WebsiteTokenRecord } from '@app/database/types/website-token.types';
import type { WebsiteRecord } from '@app/database/types/website.repository.types';
import type { WebsiteService } from '@app/modules/website';
import { NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';

import { WebsiteTokenService } from '../website-token.service';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function buildToken(overrides: Partial<WebsiteTokenRecord> = {}): WebsiteTokenRecord {
  return {
    id: 'token-a',
    websiteId: 'website-a',
    name: 'Production Token',
    prefix: 'wst_live_aaaaaaaa',
    tokenHash: 'a'.repeat(64),
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
    contactEmail: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

interface MockedWebsiteService {
  ensureOwnership: jest.Mock;
}

function buildWebsiteService(): MockedWebsiteService {
  const websiteService: MockedWebsiteService = {
    ensureOwnership: jest.fn(),
  };

  websiteService.ensureOwnership.mockResolvedValue(buildWebsite());

  return websiteService;
}

interface MockedCacheService {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  getOrSet: jest.Mock;
}

function buildCacheService(): MockedCacheService {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getOrSet: jest.fn(),
  };
}

interface MockedLogger {
  setContext: jest.Mock;
  info: jest.Mock;
  warn: jest.Mock;
}

function buildLogger(): MockedLogger {
  return {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

function buildService(): {
  service: WebsiteTokenService;
  websiteService: MockedWebsiteService;
  websiteTokenRepository: jest.Mocked<IWebsiteTokenRepository>;
  cacheService: MockedCacheService;
  logger: MockedLogger;
} {
  const websiteService = buildWebsiteService();

  const websiteTokenRepository: jest.Mocked<IWebsiteTokenRepository> = {
    findByTokenHash: jest.fn(),
    findManyByWebsiteId: jest.fn(),
    findByIdAndWebsiteId: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    updateLastUsedAt: jest.fn(),
  };

  const cacheService = buildCacheService();
  const logger = buildLogger();

  const service = new WebsiteTokenService(
    websiteService as unknown as WebsiteService,
    websiteTokenRepository,
    cacheService as unknown as CacheService,
    logger as unknown as PinoLogger,
  );

  return { service, websiteService, websiteTokenRepository, cacheService, logger };
}

describe('WebsiteTokenService', () => {
  describe('getAllForUser', () => {
    it('returns summaries for every token belonging to the website after checking ownership', async () => {
      const { service, websiteService, websiteTokenRepository } = buildService();

      websiteTokenRepository.findManyByWebsiteId.mockResolvedValue([buildToken()]);

      const result = await service.getAllForUser('website-a', 'user-a');

      expect(websiteService.ensureOwnership).toHaveBeenCalledWith('website-a', 'user-a');
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe('token-a');
    });
  });

  describe('getByIdForUser', () => {
    it('throws NotFoundException when the token does not belong to the website', async () => {
      const { service, websiteTokenRepository, logger } = buildService();

      websiteTokenRepository.findByIdAndWebsiteId.mockResolvedValue(null);

      await expect(service.getByIdForUser('website-a', 'token-missing', 'user-a')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'website_token.rejected', reason: 'not_found' }),
      );
    });

    it('returns the token summary when found', async () => {
      const { service, websiteTokenRepository } = buildService();

      websiteTokenRepository.findByIdAndWebsiteId.mockResolvedValue(buildToken());

      const result = await service.getByIdForUser('website-a', 'token-a', 'user-a');

      expect(result.id).toBe('token-a');
    });
  });

  describe('create', () => {
    it('creates a token after checking ownership and returns the plaintext token exactly once', async () => {
      const { service, websiteService, websiteTokenRepository, logger } = buildService();

      websiteTokenRepository.create.mockResolvedValue(buildToken());

      const result = await service.create('website-a', 'user-a', 'Production Token');

      expect(websiteService.ensureOwnership).toHaveBeenCalledWith('website-a', 'user-a');
      expect(websiteTokenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ websiteId: 'website-a', name: 'Production Token' }),
      );
      expect(result.token).toEqual(expect.stringContaining('wst_live_'));
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'website_token.created', websiteId: 'website-a' }),
      );
    });
  });

  describe('delete', () => {
    it('throws NotFoundException and does not touch the cache when the token does not exist', async () => {
      const { service, websiteTokenRepository, cacheService, logger } = buildService();

      websiteTokenRepository.delete.mockResolvedValue(null);

      await expect(service.delete('website-a', 'token-missing', 'user-a')).rejects.toBeInstanceOf(NotFoundException);
      expect(cacheService.del).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'website_token.rejected', reason: 'not_found' }),
      );
    });

    it('evicts the token-hash cache entry for the deleted token so it stops working immediately', async () => {
      const { service, websiteTokenRepository, cacheService, logger } = buildService();

      const tokenHash = 'deadbeef'.repeat(8);
      websiteTokenRepository.delete.mockResolvedValue(buildToken({ tokenHash }));

      await service.delete('website-a', 'token-a', 'user-a');

      expect(cacheService.del).toHaveBeenCalledWith(`token:${tokenHash}`);
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'website_token.deleted', websiteId: 'website-a', tokenId: 'token-a' }),
      );
    });

    it('evicts the cache before logging success, keyed off the deleted record and not the request tokenId', async () => {
      const { service, websiteTokenRepository, cacheService } = buildService();

      const tokenHash = 'cafebabe'.repeat(8);
      websiteTokenRepository.delete.mockResolvedValue(buildToken({ id: 'token-a', tokenHash }));

      await service.delete('website-a', 'token-a', 'user-a');

      const [delCallOrder = -1] = cacheService.del.mock.invocationCallOrder;
      const [deleteCallOrder = -1] = websiteTokenRepository.delete.mock.invocationCallOrder;

      expect(delCallOrder).toBeGreaterThan(deleteCallOrder);
    });
  });
});
