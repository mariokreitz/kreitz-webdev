import type { CacheService } from '@app/database/cache';
import type { ISocialLinkRepository } from '@app/database/interfaces/social-link.repository.interface';
import type { SocialLinkRecord } from '@app/database/types/social-link.types';
import type { WebsiteRecord } from '@app/database/types/website.repository.types';
import type { WebsiteService } from '@app/modules/website';
import { NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';

import { SocialLinkService } from '../social-link.service';
import { buildWebsiteSocialLinksCacheKey } from '../utils/social-link.utils';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function buildSocialLink(overrides: Partial<SocialLinkRecord> = {}): SocialLinkRecord {
  return {
    id: 'social-link-a',
    websiteId: 'website-a',
    platform: 'github',
    label: 'GitHub',
    url: 'https://github.com/mariokreitz',
    sortOrder: 0,
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
  del: jest.Mock;
}

function buildCacheService(): MockedCacheService {
  return {
    del: jest.fn(),
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
  service: SocialLinkService;
  websiteService: MockedWebsiteService;
  socialLinkRepository: jest.Mocked<ISocialLinkRepository>;
  cacheService: MockedCacheService;
  logger: MockedLogger;
} {
  const websiteService = buildWebsiteService();

  const socialLinkRepository: jest.Mocked<ISocialLinkRepository> = {
    findManyByWebsiteId: jest.fn(),
    findByIdAndWebsiteId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const cacheService = buildCacheService();
  const logger = buildLogger();

  const service = new SocialLinkService(
    websiteService as unknown as WebsiteService,
    socialLinkRepository,
    cacheService as unknown as CacheService,
    logger as unknown as PinoLogger,
  );

  return { service, websiteService, socialLinkRepository, cacheService, logger };
}

describe('SocialLinkService', () => {
  describe('cross-tenant ownership enforcement', () => {
    it('rejects getAllForUser for a website the user does not own without ever touching the social link repository', async () => {
      const { service, websiteService, socialLinkRepository } = buildService();
      const ownershipError = new NotFoundException('Website not found');

      websiteService.ensureOwnership.mockRejectedValue(ownershipError);

      await expect(service.getAllForUser('website-a', 'attacker')).rejects.toBe(ownershipError);
      expect(socialLinkRepository.findManyByWebsiteId).not.toHaveBeenCalled();
    });

    it('rejects create for a website the user does not own without ever writing a social link row', async () => {
      const { service, websiteService, socialLinkRepository, cacheService } = buildService();
      const ownershipError = new NotFoundException('Website not found');

      websiteService.ensureOwnership.mockRejectedValue(ownershipError);

      await expect(
        service.create('website-a', 'attacker', {
          websiteId: 'website-a',
          platform: 'github',
          url: 'https://github.com/evil',
        }),
      ).rejects.toBe(ownershipError);
      expect(socialLinkRepository.create).not.toHaveBeenCalled();
      expect(cacheService.del).not.toHaveBeenCalled();
    });

    it('rejects update for a website the user does not own without ever touching the social link repository', async () => {
      const { service, websiteService, socialLinkRepository } = buildService();
      const ownershipError = new NotFoundException('Website not found');

      websiteService.ensureOwnership.mockRejectedValue(ownershipError);

      await expect(service.update('website-a', 'social-link-a', 'attacker', { label: 'Renamed' })).rejects.toBe(
        ownershipError,
      );
      expect(socialLinkRepository.update).not.toHaveBeenCalled();
    });

    it('rejects delete for a website the user does not own without ever deleting a social link row', async () => {
      const { service, websiteService, socialLinkRepository } = buildService();
      const ownershipError = new NotFoundException('Website not found');

      websiteService.ensureOwnership.mockRejectedValue(ownershipError);

      await expect(service.delete('website-a', 'social-link-a', 'attacker')).rejects.toBe(ownershipError);
      expect(socialLinkRepository.delete).not.toHaveBeenCalled();
    });

    it('checks ownership using the requesting user id, not any id embedded in the social link record', async () => {
      const { service, websiteService, socialLinkRepository } = buildService();

      socialLinkRepository.findManyByWebsiteId.mockResolvedValue([buildSocialLink()]);

      await service.getAllForUser('website-a', 'user-a');

      expect(websiteService.ensureOwnership).toHaveBeenCalledWith('website-a', 'user-a');
    });
  });

  describe('getByIdForUser', () => {
    it('throws NotFoundException and logs a rejection when the social link does not belong to the website', async () => {
      const { service, socialLinkRepository, logger } = buildService();

      socialLinkRepository.findByIdAndWebsiteId.mockResolvedValue(null);

      await expect(service.getByIdForUser('website-a', 'missing', 'user-a')).rejects.toBeInstanceOf(NotFoundException);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'social_link.rejected', reason: 'not_found' }),
      );
    });

    it('returns the social link record when it belongs to the ownership-checked website', async () => {
      const { service, socialLinkRepository } = buildService();
      const socialLink = buildSocialLink();

      socialLinkRepository.findByIdAndWebsiteId.mockResolvedValue(socialLink);

      const result = await service.getByIdForUser('website-a', 'social-link-a', 'user-a');

      expect(result).toEqual(socialLink);
    });
  });

  describe('create', () => {
    it('creates the social link and invalidates the public listing cache for the website', async () => {
      const { service, socialLinkRepository, cacheService, logger } = buildService();
      const created = buildSocialLink();

      socialLinkRepository.create.mockResolvedValue(created);

      const result = await service.create('website-a', 'user-a', {
        websiteId: 'website-a',
        platform: 'github',
        url: 'https://github.com/mariokreitz',
      });

      expect(result).toEqual(created);
      expect(cacheService.del).toHaveBeenCalledWith(buildWebsiteSocialLinksCacheKey('website-a'));
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'social_link.created',
          websiteId: 'website-a',
          socialLinkId: 'social-link-a',
        }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException, logs a rejection, and never invalidates the cache when the social link does not exist', async () => {
      const { service, socialLinkRepository, cacheService, logger } = buildService();

      socialLinkRepository.update.mockResolvedValue(null);

      await expect(service.update('website-a', 'missing', 'user-a', { label: 'New Label' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(cacheService.del).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'social_link.rejected', reason: 'not_found' }),
      );
    });

    it('updates the social link and invalidates the public listing cache for the website', async () => {
      const { service, socialLinkRepository, cacheService } = buildService();
      const updated = buildSocialLink({ label: 'New Label' });

      socialLinkRepository.update.mockResolvedValue(updated);

      const result = await service.update('website-a', 'social-link-a', 'user-a', { label: 'New Label' });

      expect(result).toEqual(updated);
      expect(cacheService.del).toHaveBeenCalledWith(buildWebsiteSocialLinksCacheKey('website-a'));
    });
  });

  describe('delete', () => {
    it('throws NotFoundException, logs a rejection, and never invalidates the cache when the social link does not exist', async () => {
      const { service, socialLinkRepository, cacheService, logger } = buildService();

      socialLinkRepository.delete.mockResolvedValue(false);

      await expect(service.delete('website-a', 'missing', 'user-a')).rejects.toBeInstanceOf(NotFoundException);
      expect(cacheService.del).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'social_link.rejected', reason: 'not_found' }),
      );
    });

    it('deletes the social link and invalidates the public listing cache for the website', async () => {
      const { service, socialLinkRepository, cacheService, logger } = buildService();

      socialLinkRepository.delete.mockResolvedValue(true);

      await service.delete('website-a', 'social-link-a', 'user-a');

      expect(cacheService.del).toHaveBeenCalledWith(buildWebsiteSocialLinksCacheKey('website-a'));
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'social_link.deleted',
          websiteId: 'website-a',
          socialLinkId: 'social-link-a',
        }),
      );
    });
  });
});
