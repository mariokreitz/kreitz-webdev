import type { PrismaService } from '@app/database/prisma';
import type { UserRecord } from '@app/database/types/user.repository.types';

import { UserRepository } from '@app/database/repositories/user.repository';

function buildUser(overrides: Partial<UserRecord> = {}): UserRecord {
  return {
    id: 'user-1',
    email: 'owner@example.com',
    ...overrides,
  };
}

function buildPrisma(existingUser: UserRecord | null = buildUser()): {
  prisma: PrismaService;
  findUnique: jest.Mock<Promise<UserRecord | null>, [unknown]>;
} {
  const findUnique = jest.fn<Promise<UserRecord | null>, [unknown]>().mockResolvedValue(existingUser);
  const prisma = {
    user: { findUnique },
  } as unknown as PrismaService;

  return { prisma, findUnique };
}

describe('UserRepository', () => {
  describe('findById', () => {
    it('queries by id and selects only id and email', async () => {
      const { prisma, findUnique } = buildPrisma(buildUser());
      const repository = new UserRepository(prisma);

      const result = await repository.findById('user-1');

      expect(findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { id: true, email: true },
      });
      expect(result).toEqual(buildUser());
    });

    it('returns null when no user matches the id', async () => {
      const { prisma } = buildPrisma(null);
      const repository = new UserRepository(prisma);

      const result = await repository.findById('missing-user');

      expect(result).toBeNull();
    });
  });
});
