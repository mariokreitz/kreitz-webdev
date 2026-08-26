import type { PrismaService } from '@app/database/prisma';

import { PublicCompanyRepository } from '@app/database/repositories/public-company.repository';

type FindManyArgs = Record<string, unknown>;
type FindManyMock = jest.Mock<Promise<unknown[]>, [FindManyArgs]>;

function buildPrisma(findManyResult: unknown[]): { prisma: PrismaService; findMany: FindManyMock } {
  const findMany = jest.fn<Promise<unknown[]>, [FindManyArgs]>().mockResolvedValue(findManyResult);
  const prisma = { company: { findMany } } as unknown as PrismaService;

  return { prisma, findMany };
}

function firstOf<T>(items: readonly T[]): T {
  const [item] = items;

  if (item === undefined) {
    throw new Error('Expected at least one item');
  }

  return item;
}

const rawRecord = {
  id: 'company-1',
  name: 'Acme Corp',
  role: 'Senior Software Engineer',
  logoUrl: 'https://example.com/acme-logo.png',
  startDate: new Date('2022-01-01T00:00:00.000Z'),
  endDate: null,
};

describe('PublicCompanyRepository', () => {
  describe('findManyByWebsiteId', () => {
    it('queries with the given websiteId as a filter, so no code path can return another website data', async () => {
      const { prisma, findMany } = buildPrisma([]);
      const repository = new PublicCompanyRepository(prisma);

      await repository.findManyByWebsiteId('website-a');

      const [callArgs] = firstOf(findMany.mock.calls);
      const call = callArgs as { where: Record<string, unknown> };

      expect(findMany).toHaveBeenCalledTimes(1);
      expect(call.where).toEqual({ websiteId: 'website-a' });
    });

    it('orders by sortOrder ascending, then createdAt ascending', async () => {
      const { prisma, findMany } = buildPrisma([]);
      const repository = new PublicCompanyRepository(prisma);

      await repository.findManyByWebsiteId('website-a');

      const [callArgs] = firstOf(findMany.mock.calls);
      const call = callArgs as { orderBy: unknown };

      expect(call.orderBy).toEqual([{ sortOrder: 'asc' }, { createdAt: 'asc' }]);
    });

    it('selects only id, name, role, logoUrl, startDate, and endDate, never sortOrder or websiteId', async () => {
      const { prisma, findMany } = buildPrisma([]);
      const repository = new PublicCompanyRepository(prisma);

      await repository.findManyByWebsiteId('website-a');

      const [callArgs] = firstOf(findMany.mock.calls);
      const call = callArgs as { select: Record<string, unknown> };

      expect(Object.keys(call.select)).toEqual(['id', 'name', 'role', 'logoUrl', 'startDate', 'endDate']);
      expect(call.select).not.toHaveProperty('sortOrder');
      expect(call.select).not.toHaveProperty('websiteId');
    });

    it('returns the raw select result unchanged, in the documented public shape', async () => {
      const { prisma } = buildPrisma([rawRecord]);
      const repository = new PublicCompanyRepository(prisma);

      const result = await repository.findManyByWebsiteId('website-a');

      expect(result).toEqual([rawRecord]);
      expect(Object.keys(firstOf(result))).toEqual(['id', 'name', 'role', 'logoUrl', 'startDate', 'endDate']);
    });
  });
});
