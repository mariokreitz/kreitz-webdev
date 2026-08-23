import type { PrismaService } from '@app/database/prisma';

import { WebsiteProjectRepository } from '@app/database/repositories/website-project.repository';

type FindManyArgs = Record<string, unknown>;
type FindManyMock = jest.Mock<Promise<{ websiteId: string }[]>, [FindManyArgs]>;

function buildPrisma(findManyResult: { websiteId: string }[]): { prisma: PrismaService; findMany: FindManyMock } {
  const findMany = jest.fn<Promise<{ websiteId: string }[]>, [FindManyArgs]>().mockResolvedValue(findManyResult);
  const prisma = { websiteProject: { findMany } } as unknown as PrismaService;

  return { prisma, findMany };
}

describe('WebsiteProjectRepository', () => {
  describe('findWebsiteIdsByProjectId', () => {
    it('queries websiteProject filtered by the given projectId, selecting only websiteId', async () => {
      const { prisma, findMany } = buildPrisma([]);
      const repository = new WebsiteProjectRepository(prisma);

      await repository.findWebsiteIdsByProjectId('project-a');

      expect(findMany).toHaveBeenCalledWith({
        where: { projectId: 'project-a' },
        select: { websiteId: true },
      });
    });

    it('returns the flat list of websiteIds linked to the project', async () => {
      const { prisma } = buildPrisma([{ websiteId: 'website-a' }, { websiteId: 'website-b' }]);
      const repository = new WebsiteProjectRepository(prisma);

      const result = await repository.findWebsiteIdsByProjectId('project-a');

      expect(result).toEqual(['website-a', 'website-b']);
    });

    it('returns an empty array when the project is not linked to any website', async () => {
      const { prisma } = buildPrisma([]);
      const repository = new WebsiteProjectRepository(prisma);

      const result = await repository.findWebsiteIdsByProjectId('project-a');

      expect(result).toEqual([]);
    });
  });
});
