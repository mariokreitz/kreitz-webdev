import type { IWebsiteDomainRepository } from '@app/database/interfaces/website-domain.repository.interface';
import type { WebsiteDomainRecord } from '@app/database/types/website-domain.types';
import type { WebsiteRecord } from '@app/database/types/website.repository.types';
import type { WebsiteService } from '@app/modules/website';
import { NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';

import type { DomainVerificationOutcome, DomainVerificationService } from '../domain-verification.service';
import { WebsiteDomainService } from '../website-domain.service';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function buildWebsiteDomain(overrides: Partial<WebsiteDomainRecord> = {}): WebsiteDomainRecord {
  return {
    id: 'domain-a',
    websiteId: 'website-a',
    domain: 'mario.dev',
    verified: false,
    verifiedAt: null,
    verificationToken: 'verification-token-a',
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

interface MockedDomainVerificationService {
  checkToken: jest.Mock<Promise<DomainVerificationOutcome>, [string, string]>;
}

function buildDomainVerificationService(): MockedDomainVerificationService {
  return {
    checkToken: jest.fn<Promise<DomainVerificationOutcome>, [string, string]>(),
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
  service: WebsiteDomainService;
  websiteService: MockedWebsiteService;
  websiteDomainRepository: jest.Mocked<IWebsiteDomainRepository>;
  domainVerificationService: MockedDomainVerificationService;
  logger: MockedLogger;
} {
  const websiteService = buildWebsiteService();

  const websiteDomainRepository: jest.Mocked<IWebsiteDomainRepository> = {
    findManyByWebsiteId: jest.fn(),
    findByIdAndWebsiteId: jest.fn(),
    findByDomain: jest.fn(),
    findVerifiedByDomain: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    markVerified: jest.fn(),
  };

  const domainVerificationService = buildDomainVerificationService();
  const logger = buildLogger();

  const service = new WebsiteDomainService(
    websiteService as unknown as WebsiteService,
    websiteDomainRepository,
    domainVerificationService as unknown as DomainVerificationService,
    logger as unknown as PinoLogger,
  );

  return { service, websiteService, websiteDomainRepository, domainVerificationService, logger };
}

describe('WebsiteDomainService', () => {
  describe('update', () => {
    it('resets verified and verifiedAt when the domain is changed to a different, already-verified hostname', async () => {
      const { service, websiteDomainRepository } = buildService();

      const existingDomain = buildWebsiteDomain({ verified: true, verifiedAt: NOW });
      const updatedDomain = buildWebsiteDomain({ domain: 'new-domain.dev', verified: false, verifiedAt: null });

      websiteDomainRepository.findByIdAndWebsiteId.mockResolvedValue(existingDomain);
      websiteDomainRepository.findByDomain.mockResolvedValue(null);
      websiteDomainRepository.update.mockResolvedValue(updatedDomain);

      const result = await service.update('website-a', 'domain-a', 'user-a', 'new-domain.dev');

      expect(websiteDomainRepository.update).toHaveBeenCalledWith('domain-a', 'website-a', 'new-domain.dev', true);
      expect(result).toEqual(updatedDomain);
      expect(result.verified).toBe(false);
      expect(result.verifiedAt).toBeNull();
    });

    it('leaves verified untouched and never calls the repository update when the domain is omitted', async () => {
      const { service, websiteDomainRepository } = buildService();

      const existingDomain = buildWebsiteDomain({ verified: true, verifiedAt: NOW });

      websiteDomainRepository.findByIdAndWebsiteId.mockResolvedValue(existingDomain);

      const result = await service.update('website-a', 'domain-a', 'user-a', undefined);

      expect(websiteDomainRepository.update).not.toHaveBeenCalled();
      expect(result).toEqual(existingDomain);
    });

    it('leaves verified untouched and never calls the repository update when the domain is unchanged', async () => {
      const { service, websiteDomainRepository } = buildService();

      const existingDomain = buildWebsiteDomain({ verified: true, verifiedAt: NOW });

      websiteDomainRepository.findByIdAndWebsiteId.mockResolvedValue(existingDomain);

      const result = await service.update('website-a', 'domain-a', 'user-a', existingDomain.domain);

      expect(websiteDomainRepository.update).not.toHaveBeenCalled();
      expect(result).toEqual(existingDomain);
    });
  });

  describe('verify', () => {
    it('throws NotFoundException, never checks the token, and logs a rejection when the domain does not belong to the website', async () => {
      const { service, websiteDomainRepository, domainVerificationService, logger } = buildService();

      websiteDomainRepository.findByIdAndWebsiteId.mockResolvedValue(null);

      await expect(service.verify('website-a', 'domain-missing', 'user-a')).rejects.toBeInstanceOf(NotFoundException);
      expect(domainVerificationService.checkToken).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'website_domain.rejected', reason: 'not_found' }),
      );
    });

    it('propagates ownership rejection and never touches the repository or verification service', async () => {
      const { service, websiteService, websiteDomainRepository, domainVerificationService } = buildService();

      const ownershipError = new NotFoundException('Website not found');
      websiteService.ensureOwnership.mockRejectedValue(ownershipError);

      await expect(service.verify('website-a', 'domain-a', 'user-a')).rejects.toBe(ownershipError);
      expect(websiteDomainRepository.findByIdAndWebsiteId).not.toHaveBeenCalled();
      expect(domainVerificationService.checkToken).not.toHaveBeenCalled();
    });

    it('marks the domain verified, returns a null failureReason, and logs success when the token check matches', async () => {
      const { service, websiteDomainRepository, domainVerificationService, logger } = buildService();

      const existingDomain = buildWebsiteDomain();
      const verifiedDomain = buildWebsiteDomain({ verified: true, verifiedAt: NOW });

      websiteDomainRepository.findByIdAndWebsiteId.mockResolvedValue(existingDomain);
      domainVerificationService.checkToken.mockResolvedValue({ matched: true });
      websiteDomainRepository.markVerified.mockResolvedValue(verifiedDomain);

      const result = await service.verify('website-a', 'domain-a', 'user-a');

      expect(domainVerificationService.checkToken).toHaveBeenCalledWith('mario.dev', 'verification-token-a');
      expect(websiteDomainRepository.markVerified).toHaveBeenCalledWith('domain-a', 'website-a', expect.any(Date));
      expect(result).toMatchObject({
        id: 'domain-a',
        websiteId: 'website-a',
        domain: 'mario.dev',
        verified: true,
        failureReason: null,
      });
      expect(logger.info).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'website_domain.verify_succeeded',
          websiteId: 'website-a',
          domainId: 'domain-a',
        }),
      );
    });

    it('never marks the domain verified, returns the outcome reason, and logs a warning when the token check does not match', async () => {
      const { service, websiteDomainRepository, domainVerificationService, logger } = buildService();

      const existingDomain = buildWebsiteDomain();

      websiteDomainRepository.findByIdAndWebsiteId.mockResolvedValue(existingDomain);
      domainVerificationService.checkToken.mockResolvedValue({ matched: false, reason: 'token_mismatch' });

      const result = await service.verify('website-a', 'domain-a', 'user-a');

      expect(websiteDomainRepository.markVerified).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        id: 'domain-a',
        verified: false,
        failureReason: 'token_mismatch',
      });
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'website_domain.verify_failed',
          websiteId: 'website-a',
          domainId: 'domain-a',
          reason: 'token_mismatch',
        }),
      );
    });

    it('throws NotFoundException when the domain is deleted concurrently between the lookup and markVerified', async () => {
      const { service, websiteDomainRepository, domainVerificationService, logger } = buildService();

      websiteDomainRepository.findByIdAndWebsiteId.mockResolvedValue(buildWebsiteDomain());
      domainVerificationService.checkToken.mockResolvedValue({ matched: true });
      websiteDomainRepository.markVerified.mockResolvedValue(null);

      await expect(service.verify('website-a', 'domain-a', 'user-a')).rejects.toBeInstanceOf(NotFoundException);
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'website_domain.rejected', reason: 'not_found' }),
      );
    });
  });
});
