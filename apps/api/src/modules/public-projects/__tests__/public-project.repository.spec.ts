import type { PrismaService } from '@app/database/prisma';

import { PublicProjectRepository } from '@app/database/repositories/public-project.repository';

type FindManyArgs = Record<string, unknown>;
type FindManyMock = jest.Mock<Promise<unknown[]>, [FindManyArgs]>;

function buildPrisma(findManyResult: unknown[]): { prisma: PrismaService; findMany: FindManyMock } {
  const findMany = jest.fn<Promise<unknown[]>, [FindManyArgs]>().mockResolvedValue(findManyResult);
  const prisma = { websiteProject: { findMany } } as unknown as PrismaService;

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
  project: {
    id: 'project-1',
    name: 'My awesome project',
    description: 'A project description',
    repoUrl: 'https://github.com/mariokreitz/my-project',
    liveUrl: 'https://myproject.dev',
    tags: ['Angular', 'NestJS'],
    imageUrl: 'https://example.com/project.png',
    category: 'OPEN_SOURCE',
    githubStars: 42,
    githubCreatedAt: new Date('2025-01-01T00:00:00.000Z'),
    githubUpdatedAt: new Date('2025-12-30T00:00:00.000Z'),
  },
};

describe('PublicProjectRepository', () => {
  describe('findPublishedByWebsiteId', () => {
    it('queries with the given websiteId as a filter, so no code path can return another website data', async () => {
      const { prisma, findMany } = buildPrisma([]);
      const repository = new PublicProjectRepository(prisma);

      await repository.findPublishedByWebsiteId('website-a');

      const [callArgs] = firstOf(findMany.mock.calls);
      const call = callArgs as { where: Record<string, unknown> };

      expect(findMany).toHaveBeenCalledTimes(1);
      expect(call.where).toMatchObject({ websiteId: 'website-a' });
    });

    it('queries with published: true, excluding unpublished projects at the query layer', async () => {
      const { prisma, findMany } = buildPrisma([]);
      const repository = new PublicProjectRepository(prisma);

      await repository.findPublishedByWebsiteId('website-a');

      const [callArgs] = firstOf(findMany.mock.calls);
      const call = callArgs as { where: Record<string, unknown> };

      expect(call.where).toMatchObject({ published: true });
    });

    it('selects only id, name, description, repoUrl, liveUrl, tags, imageUrl, category, and GitHub metadata from the related project, never githubOwner, githubRepo, or sortOrder', async () => {
      const { prisma, findMany } = buildPrisma([]);
      const repository = new PublicProjectRepository(prisma);

      await repository.findPublishedByWebsiteId('website-a');

      const [callArgs] = firstOf(findMany.mock.calls);
      const call = callArgs as { select: { project: { select: Record<string, unknown> } } };
      const projectSelect = call.select.project.select;

      expect(Object.keys(projectSelect)).toEqual([
        'id',
        'name',
        'description',
        'repoUrl',
        'liveUrl',
        'tags',
        'imageUrl',
        'category',
        'githubStars',
        'githubCreatedAt',
        'githubUpdatedAt',
      ]);
      expect(projectSelect).not.toHaveProperty('githubOwner');
      expect(projectSelect).not.toHaveProperty('githubRepo');
      expect(projectSelect).not.toHaveProperty('sortOrder');
    });

    it('maps the nested project into the documented public shape with exactly the 11 allowed fields', async () => {
      const { prisma } = buildPrisma([rawRecord]);
      const repository = new PublicProjectRepository(prisma);

      const result = await repository.findPublishedByWebsiteId('website-a');

      expect(result).toEqual([
        {
          id: 'project-1',
          name: 'My awesome project',
          description: 'A project description',
          repoUrl: 'https://github.com/mariokreitz/my-project',
          liveUrl: 'https://myproject.dev',
          tags: ['Angular', 'NestJS'],
          imageUrl: 'https://example.com/project.png',
          category: 'OPEN_SOURCE',
          githubStars: 42,
          githubCreatedAt: new Date('2025-01-01T00:00:00.000Z'),
          githubUpdatedAt: new Date('2025-12-30T00:00:00.000Z'),
        },
      ]);
      expect(Object.keys(firstOf(result))).toEqual([
        'id',
        'name',
        'description',
        'repoUrl',
        'liveUrl',
        'tags',
        'imageUrl',
        'category',
        'githubStars',
        'githubCreatedAt',
        'githubUpdatedAt',
      ]);
    });

    it('strips extra fields from the mapping even if the underlying query result carries them, guarding against a newly-added sensitive field silently leaking', async () => {
      const leakyRawRecord = {
        project: {
          ...rawRecord.project,
          githubOwner: 'mariokreitz',
          githubRepo: 'my-project',
          sortOrder: 3,
        },
      };
      const { prisma } = buildPrisma([leakyRawRecord]);
      const repository = new PublicProjectRepository(prisma);

      const result = await repository.findPublishedByWebsiteId('website-a');

      const mapped = firstOf(result);

      expect(Object.keys(mapped)).toEqual([
        'id',
        'name',
        'description',
        'repoUrl',
        'liveUrl',
        'tags',
        'imageUrl',
        'category',
        'githubStars',
        'githubCreatedAt',
        'githubUpdatedAt',
      ]);
      expect(mapped).not.toHaveProperty('githubOwner');
      expect(mapped).not.toHaveProperty('githubRepo');
      expect(mapped).not.toHaveProperty('sortOrder');
    });
  });
});
