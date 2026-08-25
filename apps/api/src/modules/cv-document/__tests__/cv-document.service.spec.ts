import type { ICvDocumentRepository } from '@app/database/interfaces/cv-document.repository.interface';
import type { CvDocumentMeta, CvDocumentRecord } from '@app/database/types/cv-document.types';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';

import { CvDocumentService } from '../cv-document.service';

const NOW = new Date('2026-01-01T00:00:00.000Z');
const PDF_HEADER = Buffer.from('%PDF-1.7\n%rest of a real pdf');
const NOT_A_PDF = Buffer.from('this is not a pdf, just renamed');

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

function buildRecord(overrides: Partial<CvDocumentRecord> = {}): CvDocumentRecord {
  return {
    id: 'cv-1',
    userId: 'user-a',
    fileName: 'cv.pdf',
    mimeType: 'application/pdf',
    sizeBytes: PDF_HEADER.length,
    data: PDF_HEADER,
    uploadedAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildMeta(overrides: Partial<CvDocumentMeta> = {}): CvDocumentMeta {
  const { id, userId, fileName, mimeType, sizeBytes, uploadedAt, updatedAt } = buildRecord(overrides);

  return { id, userId, fileName, mimeType, sizeBytes, uploadedAt, updatedAt };
}

function buildFile(overrides: Partial<Express.Multer.File> = {}): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'cv.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: PDF_HEADER.length,
    buffer: PDF_HEADER,
    destination: '',
    filename: '',
    path: '',
    stream: undefined as never,
    ...overrides,
  };
}

function buildService(): {
  service: CvDocumentService;
  repository: jest.Mocked<ICvDocumentRepository>;
  logger: MockedLogger;
} {
  const repository: jest.Mocked<ICvDocumentRepository> = {
    findByUserId: jest.fn(),
    findMetaByUserId: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  };

  const logger = buildLogger();
  const service = new CvDocumentService(repository, logger as unknown as PinoLogger);

  return { service, repository, logger };
}

describe('CvDocumentService', () => {
  describe('getStatus', () => {
    it('returns null when the user has no CV uploaded', async () => {
      const { service, repository } = buildService();

      repository.findMetaByUserId.mockResolvedValue(null);

      await expect(service.getStatus('user-a')).resolves.toBeNull();
    });

    it('returns the metadata when a CV exists', async () => {
      const { service, repository } = buildService();
      const meta = buildMeta();

      repository.findMetaByUserId.mockResolvedValue(meta);

      await expect(service.getStatus('user-a')).resolves.toEqual(meta);
    });
  });

  describe('upload', () => {
    it('rejects when no file was provided', async () => {
      const { service, repository } = buildService();

      await expect(service.upload('user-a', undefined)).rejects.toThrow(BadRequestException);
      expect(repository.upsert).not.toHaveBeenCalled();
    });

    it('rejects a file over the maximum size before inspecting its content', async () => {
      const { service, repository } = buildService();
      const oversized = buildFile({ size: 10 * 1024 * 1024 + 1, buffer: NOT_A_PDF });

      await expect(service.upload('user-a', oversized)).rejects.toThrow(BadRequestException);
      expect(repository.upsert).not.toHaveBeenCalled();
    });

    it('rejects a file whose extension/mimetype claims PDF but whose content is not a real PDF', async () => {
      const { service, repository, logger } = buildService();
      const fakeFile = buildFile({ originalname: 'resume.pdf', mimetype: 'application/pdf', buffer: NOT_A_PDF });

      await expect(service.upload('user-a', fakeFile)).rejects.toThrow(BadRequestException);
      expect(repository.upsert).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'cv_document.rejected', reason: 'invalid_pdf_signature' }),
      );
    });

    it('accepts and stores a genuine PDF, ignoring the client-supplied mimetype for the stored value', async () => {
      const { service, repository } = buildService();
      const realFile = buildFile();
      const stored = buildRecord();

      repository.upsert.mockResolvedValue(stored);

      const result = await service.upload('user-a', realFile);

      expect(result).toEqual(stored);
      expect(repository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-a',
          fileName: 'cv.pdf',
          mimeType: 'application/pdf',
          sizeBytes: realFile.size,
          data: realFile.buffer,
        }),
      );
    });
  });

  describe('remove', () => {
    it('deletes the CV when one exists', async () => {
      const { service, repository } = buildService();

      repository.delete.mockResolvedValue(true);

      await expect(service.remove('user-a')).resolves.toBeUndefined();
    });

    it('throws NotFoundException when no CV exists for the user', async () => {
      const { service, repository } = buildService();

      repository.delete.mockResolvedValue(false);

      await expect(service.remove('user-a')).rejects.toThrow(NotFoundException);
    });
  });
});
