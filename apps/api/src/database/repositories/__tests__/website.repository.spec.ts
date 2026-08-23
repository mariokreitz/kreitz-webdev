import type { PrismaService } from '@app/database/prisma';
import type { UpdateWebsiteData, WebsiteRecord } from '@app/database/types/website.repository.types';

import { WebsiteRepository } from '@app/database/repositories/website.repository';
import { ConflictException } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';

interface UpdateManyArgs {
  where: Record<string, unknown>;
  data: Record<string, unknown>;
}

interface DeleteManyArgs {
  where: Record<string, unknown>;
}

function buildWebsite(overrides: Partial<WebsiteRecord> = {}): WebsiteRecord {
  return {
    id: 'website-1',
    userId: 'user-1',
    name: 'My Website',
    slug: 'my-website',
    enabled: true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function buildPrisma(existingWebsite: unknown = buildWebsite()): {
  prisma: PrismaService;
  findFirst: jest.Mock<Promise<unknown>, [unknown]>;
  updateMany: jest.Mock<Promise<{ count: number }>, [UpdateManyArgs]>;
  deleteMany: jest.Mock<Promise<{ count: number }>, [DeleteManyArgs]>;
  create: jest.Mock<Promise<unknown>, [unknown]>;
} {
  const findFirst = jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue(existingWebsite);
  const updateMany = jest.fn<Promise<{ count: number }>, [UpdateManyArgs]>().mockResolvedValue({ count: 1 });
  const deleteMany = jest.fn<Promise<{ count: number }>, [DeleteManyArgs]>().mockResolvedValue({ count: 1 });
  const create = jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue(buildWebsite());
  const prisma = {
    website: { findFirst, updateMany, deleteMany, create },
  } as unknown as PrismaService;

  return { prisma, findFirst, updateMany, deleteMany, create };
}

function buildSlugUniqueViolation(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed on the fields: (`slug`)', {
    code: 'P2002',
    clientVersion: '7.9.1',
    meta: {
      modelName: 'Website',
      driverAdapterError: {
        name: 'DriverAdapterError',
        cause: {
          kind: 'UniqueConstraintViolation',
          originalCode: '23505',
          originalMessage: 'duplicate key value violates unique constraint "website_slug_key"',
          constraint: { fields: ['"slug"'] },
        },
      },
    },
  });
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

const baseUpdateData: UpdateWebsiteData = { name: 'Renamed Website' };

describe('WebsiteRepository', () => {
  describe('create', () => {
    it('translates a P2002 violation on the slug constraint into a ConflictException', async () => {
      const { prisma, create } = buildPrisma();

      create.mockRejectedValue(buildSlugUniqueViolation());

      const repository = new WebsiteRepository(prisma);

      await expect(
        repository.create({ userId: 'user-1', name: 'My Website', slug: 'taken-slug', domain: 'example.com' }),
      ).rejects.toThrow(ConflictException);
    });

    it('translates a P2002 violation on the WebsiteDomain domain constraint into a ConflictException', async () => {
      const { prisma, create } = buildPrisma();

      create.mockRejectedValue(buildDomainUniqueViolation());

      const repository = new WebsiteRepository(prisma);

      await expect(
        repository.create({ userId: 'user-1', name: 'My Website', slug: 'my-website', domain: 'taken.com' }),
      ).rejects.toThrow(ConflictException);
      await expect(
        repository.create({ userId: 'user-1', name: 'My Website', slug: 'my-website', domain: 'taken.com' }),
      ).rejects.toThrow('This domain is already registered');
    });

    it('re-throws a P2002 violation on an unrelated constraint unchanged', async () => {
      const { prisma, create } = buildPrisma();
      const unrelatedViolation = buildUnrelatedUniqueViolation();

      create.mockRejectedValue(unrelatedViolation);

      const repository = new WebsiteRepository(prisma);

      await expect(
        repository.create({ userId: 'user-1', name: 'My Website', slug: 'my-website', domain: 'example.com' }),
      ).rejects.toBe(unrelatedViolation);
    });
  });

  describe('update', () => {
    it('updates atomically scoped by (id, userId), then re-reads the record to return the full updated shape', async () => {
      const { prisma, updateMany, findFirst } = buildPrisma(buildWebsite());
      const repository = new WebsiteRepository(prisma);

      const result = await repository.update('website-1', 'user-1', baseUpdateData);

      const { where, data } = firstCall(updateMany.mock.calls);

      expect(where).toEqual({ id: 'website-1', userId: 'user-1' });
      expect(data).toEqual(baseUpdateData);
      expect(firstCall(findFirst.mock.calls)).toEqual({ where: { id: 'website-1', userId: 'user-1' } });
      expect(result).toEqual(buildWebsite());
    });

    it('returns null without reading the record when no row matches the scoped (id, userId) where clause', async () => {
      const { prisma, updateMany, findFirst } = buildPrisma();

      updateMany.mockResolvedValue({ count: 0 });

      const repository = new WebsiteRepository(prisma);

      const result = await repository.update('website-1', 'someone-else', baseUpdateData);

      expect(result).toBeNull();
      expect(findFirst).not.toHaveBeenCalled();
    });

    it('translates a P2002 violation on the slug constraint into a ConflictException', async () => {
      const { prisma, updateMany } = buildPrisma();

      updateMany.mockRejectedValue(buildSlugUniqueViolation());

      const repository = new WebsiteRepository(prisma);

      await expect(repository.update('website-1', 'user-1', { slug: 'taken-slug' })).rejects.toThrow(ConflictException);
      await expect(repository.update('website-1', 'user-1', { slug: 'taken-slug' })).rejects.toThrow(
        'A website with this slug already exists',
      );
    });

    it('re-throws a P2002 violation on the WebsiteDomain domain constraint unchanged, since update cannot write domains', async () => {
      const { prisma, updateMany } = buildPrisma();
      const domainViolation = buildDomainUniqueViolation();

      updateMany.mockRejectedValue(domainViolation);

      const repository = new WebsiteRepository(prisma);

      await expect(repository.update('website-1', 'user-1', baseUpdateData)).rejects.toBe(domainViolation);
    });

    it('re-throws a P2002 violation on an unrelated constraint unchanged', async () => {
      const { prisma, updateMany } = buildPrisma();
      const unrelatedViolation = buildUnrelatedUniqueViolation();

      updateMany.mockRejectedValue(unrelatedViolation);

      const repository = new WebsiteRepository(prisma);

      await expect(repository.update('website-1', 'user-1', baseUpdateData)).rejects.toBe(unrelatedViolation);
    });

    it('re-throws a non-Prisma error from the updateMany call unchanged', async () => {
      const { prisma, updateMany } = buildPrisma();
      const genericError = new Error('connection lost');

      updateMany.mockRejectedValue(genericError);

      const repository = new WebsiteRepository(prisma);

      await expect(repository.update('website-1', 'user-1', baseUpdateData)).rejects.toBe(genericError);
    });
  });

  describe('delete', () => {
    it('deletes atomically scoped by (id, userId) and returns true when a row matched', async () => {
      const { prisma, deleteMany } = buildPrisma();
      const repository = new WebsiteRepository(prisma);

      const result = await repository.delete('website-1', 'user-1');

      expect(firstCall(deleteMany.mock.calls)).toEqual({ where: { id: 'website-1', userId: 'user-1' } });
      expect(result).toBe(true);
    });

    it('returns false when no row matches the scoped (id, userId) where clause', async () => {
      const { prisma, deleteMany } = buildPrisma();

      deleteMany.mockResolvedValue({ count: 0 });

      const repository = new WebsiteRepository(prisma);

      const result = await repository.delete('website-1', 'user-1');

      expect(result).toBe(false);
    });

    it('returns false when the website exists but is owned by a different userId', async () => {
      const { prisma, deleteMany } = buildPrisma();

      deleteMany.mockResolvedValue({ count: 0 });

      const repository = new WebsiteRepository(prisma);

      const result = await repository.delete('website-1', 'someone-else');

      expect(firstCall(deleteMany.mock.calls)).toEqual({ where: { id: 'website-1', userId: 'someone-else' } });
      expect(result).toBe(false);
    });

    it('re-throws a non-Prisma error from the deleteMany call unchanged', async () => {
      const { prisma, deleteMany } = buildPrisma();
      const genericError = new Error('connection lost');

      deleteMany.mockRejectedValue(genericError);

      const repository = new WebsiteRepository(prisma);

      await expect(repository.delete('website-1', 'user-1')).rejects.toBe(genericError);
    });
  });
});
