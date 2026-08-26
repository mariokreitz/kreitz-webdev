import type { CacheService } from '@app/database/cache';
import type { ICompanyRepository } from '@app/database/interfaces/company.repository.interface';
import type { CompanyRecord } from '@app/database/types/company.types';
import type { WebsiteRecord } from '@app/database/types/website.repository.types';
import type { WebsiteService } from '@app/modules/website';
import { NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';

import { CompanyService } from '../company.service';
import { buildWebsiteCompaniesCacheKey } from '../utils/company.utils';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function buildCompany(overrides: Partial<CompanyRecord> = {}): CompanyRecord {
  return {
    id: 'company-a',
    websiteId: 'website-a',
    name: 'Acme Corp',
    role: 'Senior Software Engineer',
    logoUrl: 'https://example.com/acme-logo.png',
    startDate: NOW,
    endDate: null,
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
  service: CompanyService;
  websiteService: MockedWebsiteService;
  companyRepository: jest.Mocked<ICompanyRepository>;
  cacheService: MockedCacheService;
  logger: MockedLogger;
} {
  const websiteService = buildWebsiteService();

  const companyRepository: jest.Mocked<ICompanyRepository> = {
    findManyByWebsiteId: jest.fn(),
    findByIdAndWebsiteId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const cacheService = buildCacheService();
  const logger = buildLogger();

  const service = new CompanyService(
    websiteService as unknown as WebsiteService,
    companyRepository,
    cacheService as unknown as CacheService,
    logger as unknown as PinoLogger,
  );

  return { service, websiteService, companyRepository, cacheService, logger };
}

describe('CompanyService', () => {
  describe('cross-tenant ownership enforcement', () => {
    it('rejects getAllForUser for a website the user does not own without ever touching the company repository', async () => {
      const { service, websiteService, companyRepository } = buildService();
      const ownershipError = new NotFoundException('Website not found');

      websiteService.ensureOwnership.mockRejectedValue(ownershipError);

      await expect(service.getAllForUser('website-a', 'attacker')).rejects.toBe(ownershipError);
      expect(companyRepository.findManyByWebsiteId).not.toHaveBeenCalled();
    });

    it('rejects create for a website the user does not own without ever writing a company row', async () => {
      const { service, websiteService, companyRepository, cacheService } = buildService();
      const ownershipError = new NotFoundException('Website not found');

      websiteService.ensureOwnership.mockRejectedValue(ownershipError);

      await expect(service.create('website-a', 'attacker', { websiteId: 'website-a', name: 'Evil Corp' })).rejects.toBe(
        ownershipError,
      );
      expect(companyRepository.create).not.toHaveBeenCalled();
      expect(cacheService.del).not.toHaveBeenCalled();
    });

    it('rejects update for a website the user does not own without ever touching the company repository', async () => {
      const { service, websiteService, companyRepository } = buildService();
      const ownershipError = new NotFoundException('Website not found');

      websiteService.ensureOwnership.mockRejectedValue(ownershipError);

      await expect(service.update('website-a', 'company-a', 'attacker', { name: 'Renamed' })).rejects.toBe(
        ownershipError,
      );
      expect(companyRepository.update).not.toHaveBeenCalled();
    });

    it('rejects delete for a website the user does not own without ever deleting a company row', async () => {
      const { service, websiteService, companyRepository } = buildService();
      const ownershipError = new NotFoundException('Website not found');

      websiteService.ensureOwnership.mockRejectedValue(ownershipError);

      await expect(service.delete('website-a', 'company-a', 'attacker')).rejects.toBe(ownershipError);
      expect(companyRepository.delete).not.toHaveBeenCalled();
    });

    it('checks ownership using the requesting user id, not any id embedded in the company record', async () => {
      const { service, websiteService, companyRepository } = buildService();

      companyRepository.findManyByWebsiteId.mockResolvedValue([buildCompany()]);

      await service.getAllForUser('website-a', 'user-a');

      expect(websiteService.ensureOwnership).toHaveBeenCalledWith('website-a', 'user-a');
    });
  });

  describe('getByIdForUser', () => {
    it('throws NotFoundException and logs a rejection when the company does not belong to the website', async () => {
      const { service, companyRepository, logger } = buildService();

      companyRepository.findByIdAndWebsiteId.mockResolvedValue(null);

      await expect(service.getByIdForUser('website-a', 'missing', 'user-a')).rejects.toBeInstanceOf(NotFoundException);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'company.rejected', reason: 'not_found' }),
      );
    });

    it('returns the company record when it belongs to the ownership-checked website', async () => {
      const { service, companyRepository } = buildService();
      const company = buildCompany();

      companyRepository.findByIdAndWebsiteId.mockResolvedValue(company);

      const result = await service.getByIdForUser('website-a', 'company-a', 'user-a');

      expect(result).toEqual(company);
    });
  });

  describe('create', () => {
    it('creates the company and invalidates the public listing cache for the website', async () => {
      const { service, companyRepository, cacheService, logger } = buildService();
      const created = buildCompany();

      companyRepository.create.mockResolvedValue(created);

      const result = await service.create('website-a', 'user-a', { websiteId: 'website-a', name: 'Acme Corp' });

      expect(result).toEqual(created);
      expect(cacheService.del).toHaveBeenCalledWith(buildWebsiteCompaniesCacheKey('website-a'));
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'company.created', websiteId: 'website-a', companyId: 'company-a' }),
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException, logs a rejection, and never invalidates the cache when the company does not exist', async () => {
      const { service, companyRepository, cacheService, logger } = buildService();

      companyRepository.update.mockResolvedValue(null);

      await expect(service.update('website-a', 'missing', 'user-a', { name: 'New Name' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(cacheService.del).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'company.rejected', reason: 'not_found' }),
      );
    });

    it('updates the company and invalidates the public listing cache for the website', async () => {
      const { service, companyRepository, cacheService } = buildService();
      const updated = buildCompany({ name: 'New Name' });

      companyRepository.update.mockResolvedValue(updated);

      const result = await service.update('website-a', 'company-a', 'user-a', { name: 'New Name' });

      expect(result).toEqual(updated);
      expect(cacheService.del).toHaveBeenCalledWith(buildWebsiteCompaniesCacheKey('website-a'));
    });
  });

  describe('delete', () => {
    it('throws NotFoundException, logs a rejection, and never invalidates the cache when the company does not exist', async () => {
      const { service, companyRepository, cacheService, logger } = buildService();

      companyRepository.delete.mockResolvedValue(false);

      await expect(service.delete('website-a', 'missing', 'user-a')).rejects.toBeInstanceOf(NotFoundException);
      expect(cacheService.del).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'company.rejected', reason: 'not_found' }),
      );
    });

    it('deletes the company and invalidates the public listing cache for the website', async () => {
      const { service, companyRepository, cacheService, logger } = buildService();

      companyRepository.delete.mockResolvedValue(true);

      await service.delete('website-a', 'company-a', 'user-a');

      expect(cacheService.del).toHaveBeenCalledWith(buildWebsiteCompaniesCacheKey('website-a'));
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'company.deleted', websiteId: 'website-a', companyId: 'company-a' }),
      );
    });
  });
});
