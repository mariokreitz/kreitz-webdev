import type { PrismaService } from '@app/database/prisma';
import type { CreateSocialLinkData, UpdateSocialLinkData } from '@app/database/types/social-link.types';

import { SocialLinkRepository } from '@app/database/repositories/social-link.repository';

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

function buildPrisma(existingSocialLink: unknown = { id: 'social-link-1', websiteId: 'website-1' }): {
  prisma: PrismaService;
  create: jest.Mock<Promise<unknown>, [CreateArgs]>;
  updateMany: jest.Mock<Promise<{ count: number }>, [UpdateManyArgs]>;
  deleteMany: jest.Mock<Promise<{ count: number }>, [Record<string, unknown>]>;
  findFirst: jest.Mock<Promise<unknown>, [unknown]>;
  findMany: jest.Mock<Promise<unknown[]>, [FindManyArgs]>;
} {
  const create = jest.fn<Promise<unknown>, [CreateArgs]>().mockResolvedValue({ id: 'social-link-1' });
  const updateMany = jest.fn<Promise<{ count: number }>, [UpdateManyArgs]>().mockResolvedValue({ count: 1 });
  const deleteMany = jest.fn<Promise<{ count: number }>, [Record<string, unknown>]>().mockResolvedValue({ count: 1 });
  const findFirst = jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue(existingSocialLink);
  const findMany = jest.fn<Promise<unknown[]>, [FindManyArgs]>().mockResolvedValue([]);
  const prisma = { socialLink: { create, updateMany, deleteMany, findFirst, findMany } } as unknown as PrismaService;

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

const baseCreateData: CreateSocialLinkData = {
  websiteId: 'website-1',
  platform: 'github',
  url: 'https://github.com/mariokreitz',
};

describe('SocialLinkRepository', () => {
  describe('findManyByWebsiteId', () => {
    it('scopes the query to the given websiteId and orders by sortOrder ascending, then createdAt ascending as a tiebreaker', async () => {
      const { prisma, findMany } = buildPrisma();
      const repository = new SocialLinkRepository(prisma);

      await repository.findManyByWebsiteId('website-a');

      const { where, orderBy } = firstCall(findMany.mock.calls);

      expect(where).toEqual({ websiteId: 'website-a' });
      expect(orderBy).toEqual([{ sortOrder: 'asc' }, { createdAt: 'asc' }]);
    });
  });

  describe('create', () => {
    it('always writes websiteId, platform, and url verbatim', async () => {
      const { prisma, create } = buildPrisma();
      const repository = new SocialLinkRepository(prisma);

      await repository.create(baseCreateData);

      const { data } = firstCall(create.mock.calls);

      expect(data['websiteId']).toBe('website-1');
      expect(data['platform']).toBe('github');
      expect(data['url']).toBe('https://github.com/mariokreitz');
    });

    it('writes label and sortOrder verbatim when they are provided', async () => {
      const { prisma, create } = buildPrisma();
      const repository = new SocialLinkRepository(prisma);

      await repository.create({
        ...baseCreateData,
        label: 'GitHub',
        sortOrder: 3,
      });

      const { data } = firstCall(create.mock.calls);

      expect(data['label']).toBe('GitHub');
      expect(data['sortOrder']).toBe(3);
    });

    it('omits label and sortOrder from the write when they are not provided', async () => {
      const { prisma, create } = buildPrisma();
      const repository = new SocialLinkRepository(prisma);

      await repository.create(baseCreateData);

      const { data } = firstCall(create.mock.calls);

      expect('label' in data).toBe(false);
      expect('sortOrder' in data).toBe(false);
    });
  });

  describe('update', () => {
    const baseUpdateData: UpdateSocialLinkData = {};

    it('writes provided fields verbatim via an atomic (id, websiteId) scoped updateMany', async () => {
      const { prisma, updateMany } = buildPrisma();
      const repository = new SocialLinkRepository(prisma);

      await repository.update('social-link-1', 'website-1', {
        ...baseUpdateData,
        platform: 'linkedin',
        label: 'LinkedIn',
        url: 'https://linkedin.com/in/mariokreitz',
        sortOrder: 5,
      });

      const { where, data } = firstCall(updateMany.mock.calls);

      expect(where).toEqual({ id: 'social-link-1', websiteId: 'website-1' });
      expect(data['platform']).toBe('linkedin');
      expect(data['label']).toBe('LinkedIn');
      expect(data['url']).toBe('https://linkedin.com/in/mariokreitz');
      expect(data['sortOrder']).toBe(5);
    });

    it('omits fields from the write when they are not provided', async () => {
      const { prisma, updateMany } = buildPrisma();
      const repository = new SocialLinkRepository(prisma);

      await repository.update('social-link-1', 'website-1', baseUpdateData);

      const { data } = firstCall(updateMany.mock.calls);

      expect('platform' in data).toBe(false);
      expect('label' in data).toBe(false);
      expect('url' in data).toBe(false);
      expect('sortOrder' in data).toBe(false);
    });

    it('returns null without reading the social link when no row matches the scoped (id, websiteId) where clause', async () => {
      const { prisma, updateMany, findFirst } = buildPrisma();

      updateMany.mockResolvedValue({ count: 0 });

      const repository = new SocialLinkRepository(prisma);

      const result = await repository.update('social-link-1', 'website-1', baseUpdateData);

      expect(result).toBeNull();
      expect(findFirst).not.toHaveBeenCalled();
    });

    it('never lets a websiteId mismatch update a social link belonging to a different website', async () => {
      const { prisma, updateMany } = buildPrisma();

      updateMany.mockResolvedValue({ count: 0 });

      const repository = new SocialLinkRepository(prisma);

      const result = await repository.update('social-link-1', 'someone-elses-website', { label: 'Hijacked' });

      expect(result).toBeNull();
      expect(firstCall(updateMany.mock.calls).where).toEqual({
        id: 'social-link-1',
        websiteId: 'someone-elses-website',
      });
    });
  });

  describe('delete', () => {
    it('deletes via an atomic (id, websiteId) scoped deleteMany and returns true on success', async () => {
      const { prisma, deleteMany } = buildPrisma();
      const repository = new SocialLinkRepository(prisma);

      const result = await repository.delete('social-link-1', 'website-1');

      expect(result).toBe(true);
      expect(firstCall(deleteMany.mock.calls)).toEqual({
        where: { id: 'social-link-1', websiteId: 'website-1' },
      });
    });

    it('returns false when no row matches the scoped (id, websiteId) where clause', async () => {
      const { prisma, deleteMany } = buildPrisma();

      deleteMany.mockResolvedValue({ count: 0 });

      const repository = new SocialLinkRepository(prisma);

      const result = await repository.delete('social-link-1', 'someone-elses-website');

      expect(result).toBe(false);
    });
  });
});
