import type { PrismaService } from '@app/database/prisma';
import type { CreateCompanyData, UpdateCompanyData } from '@app/database/types/company.types';

import { CompanyRepository } from '@app/database/repositories/company.repository';

interface CreateArgs {
  data: Record<string, unknown>;
}

interface UpdateManyArgs {
  where: Record<string, unknown>;
  data: Record<string, unknown>;
}

interface FindManyArgs {
  where: Record<string, unknown>;
  orderBy: unknown;
}

function buildPrisma(existingCompany: unknown = { id: 'company-1', websiteId: 'website-1' }): {
  prisma: PrismaService;
  create: jest.Mock<Promise<unknown>, [CreateArgs]>;
  updateMany: jest.Mock<Promise<{ count: number }>, [UpdateManyArgs]>;
  deleteMany: jest.Mock<Promise<{ count: number }>, [Record<string, unknown>]>;
  findFirst: jest.Mock<Promise<unknown>, [unknown]>;
  findMany: jest.Mock<Promise<unknown[]>, [FindManyArgs]>;
} {
  const create = jest.fn<Promise<unknown>, [CreateArgs]>().mockResolvedValue({ id: 'company-1' });
  const updateMany = jest.fn<Promise<{ count: number }>, [UpdateManyArgs]>().mockResolvedValue({ count: 1 });
  const deleteMany = jest.fn<Promise<{ count: number }>, [Record<string, unknown>]>().mockResolvedValue({ count: 1 });
  const findFirst = jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue(existingCompany);
  const findMany = jest.fn<Promise<unknown[]>, [FindManyArgs]>().mockResolvedValue([]);
  const prisma = { company: { create, updateMany, deleteMany, findFirst, findMany } } as unknown as PrismaService;

  return { prisma, create, updateMany, deleteMany, findFirst, findMany };
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

const baseCreateData: CreateCompanyData = {
  websiteId: 'website-1',
  name: 'Acme Corp',
};

describe('CompanyRepository', () => {
  describe('findManyByWebsiteId', () => {
    it('scopes the query to the given websiteId and orders by sortOrder ascending, then createdAt ascending as a tiebreaker', async () => {
      const { prisma, findMany } = buildPrisma();
      const repository = new CompanyRepository(prisma);

      await repository.findManyByWebsiteId('website-a');

      const { where, orderBy } = firstCall(findMany.mock.calls);

      expect(where).toEqual({ websiteId: 'website-a' });
      expect(orderBy).toEqual([{ sortOrder: 'asc' }, { createdAt: 'asc' }]);
    });
  });

  describe('create', () => {
    it('writes role, logoUrl, startDate, endDate, and sortOrder verbatim when they are provided', async () => {
      const { prisma, create } = buildPrisma();
      const repository = new CompanyRepository(prisma);

      const startDate = new Date('2022-01-01T00:00:00.000Z');
      const endDate = new Date('2024-06-01T00:00:00.000Z');

      await repository.create({
        ...baseCreateData,
        role: 'Senior Software Engineer',
        logoUrl: 'https://example.com/acme-logo.png',
        startDate,
        endDate,
        sortOrder: 3,
      });

      const { data } = firstCall(create.mock.calls);

      expect(data['role']).toBe('Senior Software Engineer');
      expect(data['logoUrl']).toBe('https://example.com/acme-logo.png');
      expect(data['startDate']).toBe(startDate);
      expect(data['endDate']).toBe(endDate);
      expect(data['sortOrder']).toBe(3);
    });

    it('omits role, logoUrl, startDate, endDate, and sortOrder from the write when they are not provided', async () => {
      const { prisma, create } = buildPrisma();
      const repository = new CompanyRepository(prisma);

      await repository.create(baseCreateData);

      const { data } = firstCall(create.mock.calls);

      expect('role' in data).toBe(false);
      expect('logoUrl' in data).toBe(false);
      expect('startDate' in data).toBe(false);
      expect('endDate' in data).toBe(false);
      expect('sortOrder' in data).toBe(false);
    });
  });

  describe('update', () => {
    const baseUpdateData: UpdateCompanyData = {};

    it('writes provided fields verbatim via an atomic (id, websiteId) scoped updateMany', async () => {
      const { prisma, updateMany } = buildPrisma();
      const repository = new CompanyRepository(prisma);

      await repository.update('company-1', 'website-1', { ...baseUpdateData, name: 'New Name', sortOrder: 5 });

      const { where, data } = firstCall(updateMany.mock.calls);

      expect(where).toEqual({ id: 'company-1', websiteId: 'website-1' });
      expect(data['name']).toBe('New Name');
      expect(data['sortOrder']).toBe(5);
    });

    it('omits fields from the write when they are not provided', async () => {
      const { prisma, updateMany } = buildPrisma();
      const repository = new CompanyRepository(prisma);

      await repository.update('company-1', 'website-1', baseUpdateData);

      const { data } = firstCall(updateMany.mock.calls);

      expect('name' in data).toBe(false);
      expect('role' in data).toBe(false);
      expect('logoUrl' in data).toBe(false);
      expect('startDate' in data).toBe(false);
      expect('endDate' in data).toBe(false);
      expect('sortOrder' in data).toBe(false);
    });

    it('returns null without reading the company when no row matches the scoped (id, websiteId) where clause', async () => {
      const { prisma, updateMany, findFirst } = buildPrisma();

      updateMany.mockResolvedValue({ count: 0 });

      const repository = new CompanyRepository(prisma);

      const result = await repository.update('company-1', 'website-1', baseUpdateData);

      expect(result).toBeNull();
      expect(findFirst).not.toHaveBeenCalled();
    });

    it('never lets a websiteId mismatch update a company belonging to a different website', async () => {
      const { prisma, updateMany } = buildPrisma();

      updateMany.mockResolvedValue({ count: 0 });

      const repository = new CompanyRepository(prisma);

      const result = await repository.update('company-1', 'someone-elses-website', { name: 'Hijacked' });

      expect(result).toBeNull();
      expect(firstCall(updateMany.mock.calls).where).toEqual({
        id: 'company-1',
        websiteId: 'someone-elses-website',
      });
    });
  });

  describe('delete', () => {
    it('deletes via an atomic (id, websiteId) scoped deleteMany and returns true on success', async () => {
      const { prisma, deleteMany } = buildPrisma();
      const repository = new CompanyRepository(prisma);

      const result = await repository.delete('company-1', 'website-1');

      expect(result).toBe(true);
      expect(firstCall(deleteMany.mock.calls)).toEqual({
        where: { id: 'company-1', websiteId: 'website-1' },
      });
    });

    it('returns false when no row matches the scoped (id, websiteId) where clause', async () => {
      const { prisma, deleteMany } = buildPrisma();

      deleteMany.mockResolvedValue({ count: 0 });

      const repository = new CompanyRepository(prisma);

      const result = await repository.delete('company-1', 'someone-elses-website');

      expect(result).toBe(false);
    });
  });
});
