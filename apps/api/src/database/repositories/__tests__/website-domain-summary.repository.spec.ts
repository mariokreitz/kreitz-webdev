import type { PrismaService } from '@app/database/prisma';

import { WebsiteDomainSummaryRepository } from '@app/database/repositories/website-domain-summary.repository';

interface CountArgs {
  where: Record<string, unknown>;
}

function buildPrisma(counts: number[]): { prisma: PrismaService; count: jest.Mock<Promise<number>, [CountArgs]> } {
  const count = jest.fn<Promise<number>, [CountArgs]>();

  counts.forEach((value) => count.mockResolvedValueOnce(value));

  const prisma = { websiteDomain: { count } } as unknown as PrismaService;

  return { prisma, count };
}

function callAt(calls: CountArgs[][], index: number): CountArgs {
  const call = calls[index];

  if (call === undefined) {
    throw new Error(`Expected a call at index ${index}`);
  }

  const [args] = call;

  if (args === undefined) {
    throw new Error(`Expected the call at index ${index} to have at least one argument`);
  }

  return args;
}

describe('WebsiteDomainSummaryRepository', () => {
  describe('countForUser', () => {
    it('queries the total count scoped to the user through the enabled website relation, dropping neither filter', async () => {
      const { prisma, count } = buildPrisma([5, 3]);
      const repository = new WebsiteDomainSummaryRepository(prisma);

      await repository.countForUser('user-a');

      const { where } = callAt(count.mock.calls, 0);

      expect(where).toEqual({ website: { userId: 'user-a', enabled: true } });
    });

    it('queries the verified count with the same relation filter plus verified: true', async () => {
      const { prisma, count } = buildPrisma([5, 3]);
      const repository = new WebsiteDomainSummaryRepository(prisma);

      await repository.countForUser('user-a');

      const { where } = callAt(count.mock.calls, 1);

      expect(where).toEqual({ website: { userId: 'user-a', enabled: true }, verified: true });
    });

    it('never threads a different userId into either count call than the one it received', async () => {
      const { prisma, count } = buildPrisma([5, 3]);
      const repository = new WebsiteDomainSummaryRepository(prisma);

      await repository.countForUser('user-b');

      expect(callAt(count.mock.calls, 0).where).toMatchObject({ website: { userId: 'user-b' } });
      expect(callAt(count.mock.calls, 1).where).toMatchObject({ website: { userId: 'user-b' } });
    });

    it('maps the two independent counts into total and verified without swapping them', async () => {
      const { prisma } = buildPrisma([5, 3]);
      const repository = new WebsiteDomainSummaryRepository(prisma);

      const result = await repository.countForUser('user-a');

      expect(result).toEqual({ total: 5, verified: 3 });
    });

    it('returns zero counts as-is when the user has no domains', async () => {
      const { prisma } = buildPrisma([0, 0]);
      const repository = new WebsiteDomainSummaryRepository(prisma);

      const result = await repository.countForUser('user-c');

      expect(result).toEqual({ total: 0, verified: 0 });
    });
  });
});
