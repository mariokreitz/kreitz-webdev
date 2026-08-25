import type { PrismaService } from '@app/database/prisma';
import type { UpsertCvDocumentData } from '@app/database/types/cv-document.types';

import { CvDocumentRepository } from '../cv-document.repository';

interface UpsertArgs {
  where: { userId: string };
  create: Record<string, unknown>;
  update: Record<string, unknown>;
}

interface FindUniqueArgs {
  where: { userId: string };
  select?: Record<string, unknown>;
}

function firstCall<Args>(calls: Args[][]): Args {
  const [call] = calls;

  if (call === undefined) {
    throw new Error('Expected at least one call');
  }

  const [args] = call;

  if (args === undefined) {
    throw new Error('Expected the call to have at least one argument');
  }

  return args;
}

function buildPrisma(): {
  prisma: PrismaService;
  upsert: jest.Mock<Promise<unknown>, [UpsertArgs]>;
  findUnique: jest.Mock<Promise<unknown>, [FindUniqueArgs]>;
  deleteMany: jest.Mock<Promise<{ count: number }>, [unknown]>;
} {
  const upsert = jest.fn<Promise<unknown>, [UpsertArgs]>();
  const findUnique = jest.fn<Promise<unknown>, [FindUniqueArgs]>();
  const deleteMany = jest.fn<Promise<{ count: number }>, [unknown]>().mockResolvedValue({ count: 1 });
  const prisma = { cvDocument: { upsert, findUnique, deleteMany } } as unknown as PrismaService;

  return { prisma, upsert, findUnique, deleteMany };
}

const NOW = new Date('2026-01-01T00:00:00.000Z');

const baseUpsertInput: UpsertCvDocumentData = {
  userId: 'user-a',
  fileName: 'cv.pdf',
  mimeType: 'application/pdf',
  sizeBytes: 5,
  data: Buffer.from('%PDF-'),
};

describe('CvDocumentRepository', () => {
  describe('upsert', () => {
    it('scopes the upsert to the userId unique constraint', async () => {
      const { prisma, upsert } = buildPrisma();

      upsert.mockResolvedValue({
        id: 'cv-1',
        userId: 'user-a',
        fileName: 'cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 5,
        data: baseUpsertInput.data,
        uploadedAt: NOW,
        updatedAt: NOW,
      });

      const repository = new CvDocumentRepository(prisma);

      await repository.upsert(baseUpsertInput);

      const { where, create, update } = firstCall(upsert.mock.calls);

      expect(where).toEqual({ userId: 'user-a' });
      expect(create['userId']).toBe('user-a');
      expect(update).not.toHaveProperty('userId');
    });

    it('returns the data field as a real Buffer even when Prisma yields a plain Uint8Array', async () => {
      const { prisma, upsert } = buildPrisma();
      const rawBytes = new Uint8Array(baseUpsertInput.data);

      upsert.mockResolvedValue({
        id: 'cv-1',
        userId: 'user-a',
        fileName: 'cv.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 5,
        data: rawBytes,
        uploadedAt: NOW,
        updatedAt: NOW,
      });

      const repository = new CvDocumentRepository(prisma);

      const result = await repository.upsert(baseUpsertInput);

      expect(Buffer.isBuffer(result.data)).toBe(true);
      expect(result.data.equals(baseUpsertInput.data)).toBe(true);
    });
  });

  describe('delete', () => {
    it('returns true when a row was deleted', async () => {
      const { prisma, deleteMany } = buildPrisma();

      deleteMany.mockResolvedValue({ count: 1 });

      const repository = new CvDocumentRepository(prisma);

      await expect(repository.delete('user-a')).resolves.toBe(true);
    });

    it('returns false when no row matched', async () => {
      const { prisma, deleteMany } = buildPrisma();

      deleteMany.mockResolvedValue({ count: 0 });

      const repository = new CvDocumentRepository(prisma);

      await expect(repository.delete('user-a')).resolves.toBe(false);
    });
  });

  describe('findMetaByUserId', () => {
    it('selects only metadata fields, excluding the binary data column', async () => {
      const { prisma, findUnique } = buildPrisma();

      findUnique.mockResolvedValue(null);

      const repository = new CvDocumentRepository(prisma);

      await repository.findMetaByUserId('user-a');

      const { select } = firstCall(findUnique.mock.calls);

      expect(select).not.toHaveProperty('data');
      expect(select?.['fileName']).toBe(true);
    });
  });
});
