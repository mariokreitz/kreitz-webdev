import type { PrismaService } from '@app/database/prisma';
import type { CreateProjectData, UpdateProjectData } from '@app/database/types/project.types';

import { ProjectRepository } from '@app/database/repositories/project.repository';
import { ConflictException } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';

interface CreateArgs {
  data: Record<string, unknown>;
}

interface UpdateArgs {
  data: Record<string, unknown>;
}

function buildPrisma(existingProject: unknown = { id: 'project-1', userId: 'user-1' }): {
  prisma: PrismaService;
  create: jest.Mock<Promise<unknown>, [CreateArgs]>;
  update: jest.Mock<Promise<unknown>, [UpdateArgs]>;
  findFirst: jest.Mock<Promise<unknown>, [unknown]>;
} {
  const create = jest.fn<Promise<unknown>, [CreateArgs]>().mockResolvedValue({ id: 'project-1' });
  const update = jest.fn<Promise<unknown>, [UpdateArgs]>().mockResolvedValue({ id: 'project-1' });
  const findFirst = jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue(existingProject);
  const prisma = { project: { create, update, findFirst } } as unknown as PrismaService;

  return { prisma, create, update, findFirst };
}

function buildUserGithubUniqueViolation(): Prisma.PrismaClientKnownRequestError {
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

function buildUnrelatedUniqueViolation(): Prisma.PrismaClientKnownRequestError {
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

const baseCreateData: CreateProjectData = {
  userId: 'user-1',
  name: 'My awesome project',
};

describe('ProjectRepository', () => {
  describe('create', () => {
    it('writes repoUrl, liveUrl, and tags verbatim when they are provided', async () => {
      const { prisma, create } = buildPrisma();
      const repository = new ProjectRepository(prisma);

      await repository.create({
        ...baseCreateData,
        repoUrl: 'https://github.com/mariokreitz/my-project',
        liveUrl: 'https://myproject.dev',
        tags: ['Angular', 'NestJS'],
      });

      const { data } = firstCall(create.mock.calls);

      expect(data['repoUrl']).toBe('https://github.com/mariokreitz/my-project');
      expect(data['liveUrl']).toBe('https://myproject.dev');
      expect(data['tags']).toEqual(['Angular', 'NestJS']);
    });

    it('omits repoUrl, liveUrl, and tags from the write when they are not provided, matching the conditional-write style used for other optional fields', async () => {
      const { prisma, create } = buildPrisma();
      const repository = new ProjectRepository(prisma);

      await repository.create(baseCreateData);

      const { data } = firstCall(create.mock.calls);

      expect('repoUrl' in data).toBe(false);
      expect('liveUrl' in data).toBe(false);
      expect('tags' in data).toBe(false);
    });

    it('translates a P2002 violation on the (userId, githubId) constraint into a ConflictException', async () => {
      const { prisma, create } = buildPrisma();

      create.mockRejectedValue(buildUserGithubUniqueViolation());

      const repository = new ProjectRepository(prisma);

      await expect(repository.create({ ...baseCreateData, githubId: '123' })).rejects.toThrow(ConflictException);
      await expect(repository.create({ ...baseCreateData, githubId: '123' })).rejects.toThrow(
        'This GitHub project is already imported',
      );
    });

    it('re-throws a P2002 violation on an unrelated constraint unchanged', async () => {
      const { prisma, create } = buildPrisma();
      const unrelatedViolation = buildUnrelatedUniqueViolation();

      create.mockRejectedValue(unrelatedViolation);

      const repository = new ProjectRepository(prisma);

      await expect(repository.create(baseCreateData)).rejects.toBe(unrelatedViolation);
    });

    it('re-throws a non-Prisma error unchanged', async () => {
      const { prisma, create } = buildPrisma();
      const genericError = new Error('connection lost');

      create.mockRejectedValue(genericError);

      const repository = new ProjectRepository(prisma);

      await expect(repository.create(baseCreateData)).rejects.toBe(genericError);
    });
  });

  describe('update', () => {
    const baseUpdateData: UpdateProjectData = {};

    it('writes repoUrl, liveUrl, and tags verbatim when they are provided', async () => {
      const { prisma, update } = buildPrisma();
      const repository = new ProjectRepository(prisma);

      await repository.update('project-1', 'user-1', {
        ...baseUpdateData,
        repoUrl: 'https://github.com/mariokreitz/my-project',
        liveUrl: 'https://myproject.dev',
        tags: ['Angular', 'NestJS'],
      });

      const { data } = firstCall(update.mock.calls);

      expect(data['repoUrl']).toBe('https://github.com/mariokreitz/my-project');
      expect(data['liveUrl']).toBe('https://myproject.dev');
      expect(data['tags']).toEqual(['Angular', 'NestJS']);
    });

    it('writes an empty tags array as-is, clearing the column, since [] !== undefined', async () => {
      const { prisma, update } = buildPrisma();
      const repository = new ProjectRepository(prisma);

      await repository.update('project-1', 'user-1', { tags: [] });

      const { data } = firstCall(update.mock.calls);

      expect(data['tags']).toEqual([]);
    });

    it('omits repoUrl, liveUrl, and tags from the write when they are not provided', async () => {
      const { prisma, update } = buildPrisma();
      const repository = new ProjectRepository(prisma);

      await repository.update('project-1', 'user-1', baseUpdateData);

      const { data } = firstCall(update.mock.calls);

      expect('repoUrl' in data).toBe(false);
      expect('liveUrl' in data).toBe(false);
      expect('tags' in data).toBe(false);
    });

    it('translates a P2002 violation on the (userId, githubId) constraint into a ConflictException', async () => {
      const { prisma, update } = buildPrisma();

      update.mockRejectedValue(buildUserGithubUniqueViolation());

      const repository = new ProjectRepository(prisma);

      await expect(repository.update('project-1', 'user-1', { githubId: '123' })).rejects.toThrow(ConflictException);
    });

    it('re-throws a P2002 violation on an unrelated constraint unchanged', async () => {
      const { prisma, update } = buildPrisma();
      const unrelatedViolation = buildUnrelatedUniqueViolation();

      update.mockRejectedValue(unrelatedViolation);

      const repository = new ProjectRepository(prisma);

      await expect(repository.update('project-1', 'user-1', baseUpdateData)).rejects.toBe(unrelatedViolation);
    });
  });
});
