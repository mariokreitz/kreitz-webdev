import type { PrismaService } from '@app/database/prisma';
import type { WebsiteDomainRecord } from '@app/database/types/website-domain.types';

import { WebsiteDomainRepository } from '@app/database/repositories/website-domain.repository';
import { ConflictException } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';

interface FindFirstArgs {
  where: Record<string, unknown>;
}

interface UpdateManyArgs {
  where: Record<string, unknown>;
  data: Record<string, unknown>;
}

interface DeleteManyArgs {
  where: Record<string, unknown>;
}

function buildWebsiteDomain(overrides: Partial<WebsiteDomainRecord> = {}): WebsiteDomainRecord {
  return {
    id: 'domain-1',
    websiteId: 'website-1',
    domain: 'example.com',
    verified: false,
    verifiedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function buildPrisma(existingDomain: WebsiteDomainRecord | null = buildWebsiteDomain()): {
  prisma: PrismaService;
  findFirst: jest.Mock<Promise<WebsiteDomainRecord | null>, [FindFirstArgs]>;
  updateMany: jest.Mock<Promise<{ count: number }>, [UpdateManyArgs]>;
  deleteMany: jest.Mock<Promise<{ count: number }>, [DeleteManyArgs]>;
} {
  const findFirst = jest.fn<Promise<WebsiteDomainRecord | null>, [FindFirstArgs]>().mockResolvedValue(existingDomain);
  const updateMany = jest.fn<Promise<{ count: number }>, [UpdateManyArgs]>().mockResolvedValue({ count: 1 });
  const deleteMany = jest.fn<Promise<{ count: number }>, [DeleteManyArgs]>().mockResolvedValue({ count: 1 });
  const prisma = { websiteDomain: { findFirst, updateMany, deleteMany } } as unknown as PrismaService;

  return { prisma, findFirst, updateMany, deleteMany };
}

function buildDomainUniqueViolation(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed on the fields: (`domain`)', {
    code: 'P2002',
    clientVersion: '7.9.1',
    meta: {
      modelName: 'WebsiteDomain',
      driverAdapterError: {
        name: 'DriverAdapterError',
        cause: {
          kind: 'UniqueConstraintViolation',
          originalCode: '23505',
          originalMessage: 'duplicate key value violates unique constraint "website_domain_domain_key"',
          constraint: { fields: ['"domain"'] },
        },
      },
    },
  });
}

function buildUnrelatedUniqueViolation(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed on the fields: (`userId`,`githubId`)', {
    code: 'P2002',
    clientVersion: '7.9.1',
    meta: {
      modelName: 'Project',
      driverAdapterError: {
        name: 'DriverAdapterError',
        cause: {
          kind: 'UniqueConstraintViolation',
          originalCode: '23505',
          originalMessage: 'duplicate key value violates unique constraint "project_userId_githubId_key"',
          constraint: { fields: ['"userId"', '"githubId"'] },
        },
      },
    },
  });
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

describe('WebsiteDomainRepository', () => {
  describe('update', () => {
    it('updates atomically scoped by (id, websiteId), then re-reads the record to return the full updated shape', async () => {
      const { prisma, updateMany, findFirst } = buildPrisma();
      const repository = new WebsiteDomainRepository(prisma);

      const result = await repository.update('domain-1', 'website-1', 'new-domain.com');

      const { where, data } = firstCall(updateMany.mock.calls);

      expect(where).toEqual({ id: 'domain-1', websiteId: 'website-1' });
      expect(data).toEqual({ domain: 'new-domain.com' });
      expect(firstCall(findFirst.mock.calls)).toEqual({ where: { id: 'domain-1', websiteId: 'website-1' } });
      expect(result).toEqual(buildWebsiteDomain());
    });

    it('returns null without re-reading the record when no row matches the scoped (id, websiteId) where clause', async () => {
      const { prisma, updateMany, findFirst } = buildPrisma();

      updateMany.mockResolvedValue({ count: 0 });

      const repository = new WebsiteDomainRepository(prisma);

      const result = await repository.update('domain-1', 'other-website', 'new-domain.com');

      expect(result).toBeNull();
      expect(findFirst).not.toHaveBeenCalled();
    });

    it('translates a P2002 violation on the domain constraint into a ConflictException', async () => {
      const { prisma, updateMany } = buildPrisma();

      updateMany.mockRejectedValue(buildDomainUniqueViolation());

      const repository = new WebsiteDomainRepository(prisma);

      await expect(repository.update('domain-1', 'website-1', 'taken.com')).rejects.toThrow(ConflictException);
      await expect(repository.update('domain-1', 'website-1', 'taken.com')).rejects.toThrow(
        'This domain is already registered',
      );
    });

    it('re-throws a P2002 violation on an unrelated constraint unchanged', async () => {
      const { prisma, updateMany } = buildPrisma();
      const unrelatedViolation = buildUnrelatedUniqueViolation();

      updateMany.mockRejectedValue(unrelatedViolation);

      const repository = new WebsiteDomainRepository(prisma);

      await expect(repository.update('domain-1', 'website-1', 'new-domain.com')).rejects.toBe(unrelatedViolation);
    });

    it('re-throws a non-Prisma error unchanged', async () => {
      const { prisma, updateMany } = buildPrisma();
      const genericError = new Error('connection lost');

      updateMany.mockRejectedValue(genericError);

      const repository = new WebsiteDomainRepository(prisma);

      await expect(repository.update('domain-1', 'website-1', 'new-domain.com')).rejects.toBe(genericError);
    });
  });

  describe('delete', () => {
    it('pre-fetches the record scoped by (id, websiteId), then deletes atomically scoped the same way and returns the pre-fetched record', async () => {
      const { prisma, findFirst, deleteMany } = buildPrisma(buildWebsiteDomain());
      const repository = new WebsiteDomainRepository(prisma);

      const result = await repository.delete('domain-1', 'website-1');

      expect(firstCall(findFirst.mock.calls)).toEqual({ where: { id: 'domain-1', websiteId: 'website-1' } });
      expect(firstCall(deleteMany.mock.calls)).toEqual({ where: { id: 'domain-1', websiteId: 'website-1' } });
      expect(result).toEqual(buildWebsiteDomain());
    });

    it('returns null without calling deleteMany when no record matches the (id, websiteId) pre-check', async () => {
      const { prisma, deleteMany } = buildPrisma(null);
      const repository = new WebsiteDomainRepository(prisma);

      const result = await repository.delete('domain-1', 'other-website');

      expect(result).toBeNull();
      expect(deleteMany).not.toHaveBeenCalled();
    });

    it('returns null when the pre-fetched record was deleted concurrently, since deleteMany matched zero rows', async () => {
      const { prisma, deleteMany } = buildPrisma(buildWebsiteDomain());

      deleteMany.mockResolvedValue({ count: 0 });

      const repository = new WebsiteDomainRepository(prisma);

      const result = await repository.delete('domain-1', 'website-1');

      expect(result).toBeNull();
    });

    it('re-throws a non-Prisma error from the deleteMany call unchanged', async () => {
      const { prisma, deleteMany } = buildPrisma();
      const genericError = new Error('connection lost');

      deleteMany.mockRejectedValue(genericError);

      const repository = new WebsiteDomainRepository(prisma);

      await expect(repository.delete('domain-1', 'website-1')).rejects.toBe(genericError);
    });
  });
});
