import type { ICvDocumentRepository } from '@app/database/interfaces/cv-document.repository.interface';
import type { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';
import type { CvDocumentRecord } from '@app/database/types/cv-document.types';
import type { WebsiteRecord } from '@app/database/types/website.repository.types';
import { NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';

import { PublicCvService } from '../public-cv.service';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function buildLogger(): jest.Mocked<PinoLogger> {
  return {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as jest.Mocked<PinoLogger>;
}

function buildWebsite(overrides: Partial<WebsiteRecord> = {}): WebsiteRecord {
  return {
    id: 'website-a',
    userId: 'user-a',
    name: 'My site',
    slug: 'my-site',
    enabled: true,
    contactEmail: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildCv(overrides: Partial<CvDocumentRecord> = {}): CvDocumentRecord {
  return {
    id: 'cv-1',
    userId: 'user-a',
    fileName: 'cv.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 5,
    data: Buffer.from('%PDF-'),
    uploadedAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildService(): {
  service: PublicCvService;
  websiteRepository: jest.Mocked<IWebsiteRepository>;
  cvDocumentRepository: jest.Mocked<ICvDocumentRepository>;
} {
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

  const cvDocumentRepository: jest.Mocked<ICvDocumentRepository> = {
    findByUserId: jest.fn(),
    findMetaByUserId: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  };

  const service = new PublicCvService(websiteRepository, cvDocumentRepository, buildLogger());

  return { service, websiteRepository, cvDocumentRepository };
}

describe('PublicCvService', () => {
  it('returns the CV for the website owner when both the website and CV exist', async () => {
    const { service, websiteRepository, cvDocumentRepository } = buildService();

    websiteRepository.findById.mockResolvedValue(buildWebsite());
    cvDocumentRepository.findByUserId.mockResolvedValue(buildCv());

    const result = await service.getCvForWebsite('website-a');

    expect(result).toEqual(buildCv());
    expect(cvDocumentRepository.findByUserId).toHaveBeenCalledWith('user-a');
  });

  it('throws NotFoundException when the website does not exist', async () => {
    const { service, websiteRepository, cvDocumentRepository } = buildService();

    websiteRepository.findById.mockResolvedValue(null);

    await expect(service.getCvForWebsite('website-missing')).rejects.toThrow(NotFoundException);
    expect(cvDocumentRepository.findByUserId).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when the website owner has no CV uploaded', async () => {
    const { service, websiteRepository, cvDocumentRepository } = buildService();

    websiteRepository.findById.mockResolvedValue(buildWebsite());
    cvDocumentRepository.findByUserId.mockResolvedValue(null);

    await expect(service.getCvForWebsite('website-a')).rejects.toThrow(NotFoundException);
  });

  it('uses the same not-found message whether the website or the CV is missing, to avoid leaking which one', async () => {
    const { service, websiteRepository } = buildService();

    websiteRepository.findById.mockResolvedValue(null);

    await expect(service.getCvForWebsite('website-missing')).rejects.toThrow('No CV is available for this website');
  });
});
