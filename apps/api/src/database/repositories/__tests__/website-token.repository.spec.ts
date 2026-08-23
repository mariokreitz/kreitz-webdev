import type { PrismaService } from '@app/database/prisma';
import type { WebsiteTokenRecord } from '@app/database/types/website-token.types';

import { WebsiteTokenRepository } from '@app/database/repositories/website-token.repository';

function buildWebsiteTokenRecord(overrides: Partial<WebsiteTokenRecord> = {}): WebsiteTokenRecord {
  return {
    id: 'token-1',
    websiteId: 'website-1',
    name: 'CI token',
    prefix: 'wt_abcd',
    tokenHash: 'hashed-token-value',
    expiresAt: null,
    lastUsedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

interface FindFirstArgs {
  where: Record<string, unknown>;
}

interface DeleteManyArgs {
  where: Record<string, unknown>;
}

interface UpdateManyArgs {
  where: Record<string, unknown>;
  data: Record<string, unknown>;
}

function buildPrisma(): {
  prisma: PrismaService;
  findFirst: jest.Mock<Promise<WebsiteTokenRecord | null>, [FindFirstArgs]>;
  deleteMany: jest.Mock<Promise<{ count: number }>, [DeleteManyArgs]>;
  updateMany: jest.Mock<Promise<{ count: number }>, [UpdateManyArgs]>;
} {
  const findFirst = jest.fn<Promise<WebsiteTokenRecord | null>, [FindFirstArgs]>();
  const deleteMany = jest.fn<Promise<{ count: number }>, [DeleteManyArgs]>();
  const updateMany = jest.fn<Promise<{ count: number }>, [UpdateManyArgs]>();
  const prisma = {
    websiteToken: {
      findFirst,
      deleteMany,
      updateMany,
    },
  } as unknown as PrismaService;

  return { prisma, findFirst, deleteMany, updateMany };
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

describe('WebsiteTokenRepository', () => {
  describe('delete', () => {
    it('pre-fetches the record scoped by (id, websiteId), then deletes atomically scoped the same way and returns the pre-fetched record', async () => {
      const { prisma, findFirst, deleteMany } = buildPrisma();
      const existing = buildWebsiteTokenRecord();

      findFirst.mockResolvedValue(existing);
      deleteMany.mockResolvedValue({ count: 1 });

      const repository = new WebsiteTokenRepository(prisma);

      const result = await repository.delete('token-1', 'website-1');

      expect(result).toBe(existing);
      expect(findFirst).toHaveBeenCalledWith({
        where: { id: 'token-1', websiteId: 'website-1' },
      });
      expect(deleteMany).toHaveBeenCalledWith({ where: { id: 'token-1', websiteId: 'website-1' } });
    });

    it('returns null without calling deleteMany when no record matches the given id and websiteId', async () => {
      const { prisma, findFirst, deleteMany } = buildPrisma();

      findFirst.mockResolvedValue(null);

      const repository = new WebsiteTokenRepository(prisma);

      const result = await repository.delete('token-1', 'website-1');

      expect(result).toBeNull();
      expect(deleteMany).not.toHaveBeenCalled();
    });

    it('returns null without calling deleteMany when the record belongs to a different websiteId', async () => {
      const { prisma, findFirst, deleteMany } = buildPrisma();

      findFirst.mockResolvedValue(null);

      const repository = new WebsiteTokenRepository(prisma);

      const result = await repository.delete('token-1', 'someone-elses-website');

      expect(result).toBeNull();
      expect(findFirst).toHaveBeenCalledWith({
        where: { id: 'token-1', websiteId: 'someone-elses-website' },
      });
      expect(deleteMany).not.toHaveBeenCalled();
    });

    it('returns null when the pre-fetched record was deleted concurrently, since deleteMany matched zero rows', async () => {
      const { prisma, findFirst, deleteMany } = buildPrisma();
      const existing = buildWebsiteTokenRecord();

      findFirst.mockResolvedValue(existing);
      deleteMany.mockResolvedValue({ count: 0 });

      const repository = new WebsiteTokenRepository(prisma);

      const result = await repository.delete('token-1', 'website-1');

      expect(result).toBeNull();
    });
  });

  describe('updateLastUsedAt', () => {
    it('resolves without throwing when the token was deleted concurrently, since updateMany matches zero rows instead of throwing P2025', async () => {
      const { prisma, updateMany } = buildPrisma();

      updateMany.mockResolvedValue({ count: 0 });

      const repository = new WebsiteTokenRepository(prisma);

      await expect(repository.updateLastUsedAt('token-1', new Date())).resolves.toBeUndefined();

      const { where, data } = firstCall(updateMany.mock.calls);

      expect(where).toEqual({ id: 'token-1' });
      expect(data['lastUsedAt']).toBeInstanceOf(Date);
    });

    it('resolves without throwing when the token still exists', async () => {
      const { prisma, updateMany } = buildPrisma();

      updateMany.mockResolvedValue({ count: 1 });

      const repository = new WebsiteTokenRepository(prisma);

      await expect(repository.updateLastUsedAt('token-1', new Date())).resolves.toBeUndefined();
    });
  });
});
