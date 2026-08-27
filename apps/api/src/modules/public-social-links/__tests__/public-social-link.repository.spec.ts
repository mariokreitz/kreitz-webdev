import type { PrismaService } from '@app/database/prisma';

import { PublicSocialLinkRepository } from '@app/database/repositories/public-social-link.repository';

type FindManyArgs = Record<string, unknown>;
type FindManyMock = jest.Mock<Promise<unknown[]>, [FindManyArgs]>;

function buildPrisma(findManyResult: unknown[]): { prisma: PrismaService; findMany: FindManyMock } {
  const findMany = jest.fn<Promise<unknown[]>, [FindManyArgs]>().mockResolvedValue(findManyResult);
  const prisma = { socialLink: { findMany } } as unknown as PrismaService;

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
  id: 'social-link-1',
  platform: 'github',
  label: 'GitHub',
  url: 'https://github.com/mariokreitz',
  sortOrder: 0,
};

describe('PublicSocialLinkRepository', () => {
  describe('findManyByWebsiteId', () => {
    it('queries with the given websiteId as a filter, so no code path can return another website data', async () => {
      const { prisma, findMany } = buildPrisma([]);
      const repository = new PublicSocialLinkRepository(prisma);

      await repository.findManyByWebsiteId('website-a');

      const [callArgs] = firstOf(findMany.mock.calls);
      const call = callArgs as { where: Record<string, unknown> };

      expect(findMany).toHaveBeenCalledTimes(1);
      expect(call.where).toEqual({ websiteId: 'website-a' });
    });

    it('orders by sortOrder ascending, then createdAt ascending', async () => {
      const { prisma, findMany } = buildPrisma([]);
      const repository = new PublicSocialLinkRepository(prisma);

      await repository.findManyByWebsiteId('website-a');

      const [callArgs] = firstOf(findMany.mock.calls);
      const call = callArgs as { orderBy: unknown };

      expect(call.orderBy).toEqual([{ sortOrder: 'asc' }, { createdAt: 'asc' }]);
    });

    it('selects only id, platform, label, url, and sortOrder, never websiteId or createdAt', async () => {
      const { prisma, findMany } = buildPrisma([]);
      const repository = new PublicSocialLinkRepository(prisma);

      await repository.findManyByWebsiteId('website-a');

      const [callArgs] = firstOf(findMany.mock.calls);
      const call = callArgs as { select: Record<string, unknown> };

      expect(Object.keys(call.select)).toEqual(['id', 'platform', 'label', 'url', 'sortOrder']);
      expect(call.select).not.toHaveProperty('websiteId');
      expect(call.select).not.toHaveProperty('createdAt');
    });

    it('returns the raw select result unchanged, in the documented public shape', async () => {
      const { prisma } = buildPrisma([rawRecord]);
      const repository = new PublicSocialLinkRepository(prisma);

      const result = await repository.findManyByWebsiteId('website-a');

      expect(result).toEqual([rawRecord]);
      expect(Object.keys(firstOf(result))).toEqual(['id', 'platform', 'label', 'url', 'sortOrder']);
    });
  });
});
