import type { IProjectRepository } from '@app/database/interfaces/project.repository.interface';
import type { CreateProjectData, ProjectRecord } from '@app/database/types/project.types';
import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';

import { ProjectService } from '../project.service';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function buildProject(overrides: Partial<ProjectRecord> = {}): ProjectRecord {
  return {
    id: 'project-a',
    userId: 'user-a',
    githubId: null,
    githubOwner: null,
    githubRepo: null,
    name: 'Project A',
    description: null,
    repoUrl: null,
    liveUrl: null,
    tags: [],
    imageUrl: null,
    importedAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildLogger(): jest.Mocked<PinoLogger> {
  return {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as jest.Mocked<PinoLogger>;
}

function buildService(): {
  service: ProjectService;
  projectRepository: jest.Mocked<IProjectRepository>;
  logger: jest.Mocked<PinoLogger>;
} {
  const projectRepository: jest.Mocked<IProjectRepository> = {
    findManyByUserId: jest.fn(),
    findRepoUrlsByUserId: jest.fn(),
    findByIdAndUserId: jest.fn(),
    findByGithubId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const logger = buildLogger();

  const service = new ProjectService(projectRepository, logger);

  return { service, projectRepository, logger };
}

const baseCreateInput: CreateProjectData = {
  userId: 'user-a',
  name: 'My awesome project',
};

describe('ProjectService', () => {
  describe('create', () => {
    it('creates a project when no existing project has the same repoUrl or githubId', async () => {
      const { service, projectRepository } = buildService();

      projectRepository.findRepoUrlsByUserId.mockResolvedValue([]);
      projectRepository.create.mockResolvedValue(buildProject());

      const result = await service.create({ ...baseCreateInput, repoUrl: 'https://github.com/owner/repo' });

      expect(result).toEqual(buildProject());
      expect(projectRepository.create).toHaveBeenCalled();
    });

    it('throws ConflictException when another project for the user already has the same repoUrl, even ignoring scheme/case/trailing-slash differences', async () => {
      const { service, projectRepository } = buildService();

      projectRepository.findRepoUrlsByUserId.mockResolvedValue([
        buildProject({ id: 'project-existing', repoUrl: 'https://github.com/Owner/Repo/' }),
      ]);

      await expect(service.create({ ...baseCreateInput, repoUrl: 'http://github.com/owner/repo' })).rejects.toThrow(
        ConflictException,
      );
      await expect(service.create({ ...baseCreateInput, repoUrl: 'http://github.com/owner/repo' })).rejects.toThrow(
        'A project with this repository URL already exists',
      );
      expect(projectRepository.create).not.toHaveBeenCalled();
    });

    it('throws ConflictException on repoUrl collision even when githubId differs or is absent on either side', async () => {
      const { service, projectRepository } = buildService();

      projectRepository.findRepoUrlsByUserId.mockResolvedValue([
        buildProject({ id: 'project-existing', githubId: null, repoUrl: 'https://github.com/owner/repo' }),
      ]);

      await expect(
        service.create({
          ...baseCreateInput,
          githubId: '999',
          repoUrl: 'https://github.com/owner/repo',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws ConflictException when the githubId is already imported', async () => {
      const { service, projectRepository } = buildService();

      projectRepository.findByGithubId.mockResolvedValue(buildProject({ githubId: '123' }));

      await expect(service.create({ ...baseCreateInput, githubId: '123' })).rejects.toThrow(ConflictException);
      expect(projectRepository.create).not.toHaveBeenCalled();
    });

    it('does not check for repoUrl conflicts when repoUrl is not provided', async () => {
      const { service, projectRepository } = buildService();

      projectRepository.create.mockResolvedValue(buildProject());

      await service.create(baseCreateInput);

      expect(projectRepository.findRepoUrlsByUserId).not.toHaveBeenCalled();
      expect(projectRepository.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('does not falsely conflict when the repoUrl in the update matches the project being updated itself', async () => {
      const { service, projectRepository } = buildService();

      const existing = buildProject({ id: 'project-a', repoUrl: 'https://github.com/owner/repo' });

      projectRepository.findByIdAndUserId.mockResolvedValue(existing);
      projectRepository.update.mockResolvedValue(existing);

      await service.update('project-a', 'user-a', { repoUrl: 'https://github.com/owner/repo' });

      expect(projectRepository.findRepoUrlsByUserId).not.toHaveBeenCalled();
      expect(projectRepository.update).toHaveBeenCalled();
    });

    it('throws ConflictException when the new repoUrl collides with a different project owned by the same user', async () => {
      const { service, projectRepository } = buildService();

      const existing = buildProject({ id: 'project-a', repoUrl: 'https://github.com/owner/repo-a' });
      const other = buildProject({ id: 'project-b', repoUrl: 'https://github.com/owner/repo-b' });

      projectRepository.findByIdAndUserId.mockResolvedValue(existing);
      projectRepository.findRepoUrlsByUserId.mockResolvedValue([existing, other]);

      await expect(
        service.update('project-a', 'user-a', { repoUrl: 'https://github.com/owner/repo-b' }),
      ).rejects.toThrow(ConflictException);
      expect(projectRepository.update).not.toHaveBeenCalled();
    });

    it('excludes the project being updated from the repoUrl conflict comparison', async () => {
      const { service, projectRepository } = buildService();

      const existing = buildProject({ id: 'project-a', repoUrl: 'https://github.com/owner/repo/' });

      projectRepository.findByIdAndUserId.mockResolvedValue(existing);
      projectRepository.findRepoUrlsByUserId.mockResolvedValue([existing]);
      projectRepository.update.mockResolvedValue(existing);

      await service.update('project-a', 'user-a', { repoUrl: 'https://github.com/owner/repo' });

      expect(projectRepository.update).toHaveBeenCalled();
    });

    it('throws NotFoundException when the project does not belong to the user', async () => {
      const { service, projectRepository } = buildService();

      projectRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.update('project-a', 'user-a', { repoUrl: 'https://github.com/owner/repo' })).rejects.toThrow(
        NotFoundException,
      );
      expect(projectRepository.findRepoUrlsByUserId).not.toHaveBeenCalled();
    });
  });
});
