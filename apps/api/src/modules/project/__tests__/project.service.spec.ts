import type { CacheService } from '@app/database/cache';
import type { IProjectRepository } from '@app/database/interfaces/project.repository.interface';
import type { IWebsiteProjectRepository } from '@app/database/interfaces/website-project.repository.interface';
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

interface MockedCacheService {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  getOrSet: jest.Mock;
}

function buildCacheService(): MockedCacheService {
  return {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn().mockResolvedValue(undefined),
    getOrSet: jest.fn(),
  };
}

function buildService(): {
  service: ProjectService;
  projectRepository: jest.Mocked<IProjectRepository>;
  websiteProjectRepository: jest.Mocked<IWebsiteProjectRepository>;
  cacheService: MockedCacheService;
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

  const websiteProjectRepository: jest.Mocked<IWebsiteProjectRepository> = {
    findById: jest.fn(),
    findByWebsiteAndProject: jest.fn(),
    findManyByWebsiteId: jest.fn(),
    findWebsiteIdsByProjectId: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const cacheService = buildCacheService();
  const logger = buildLogger();

  const service = new ProjectService(
    projectRepository,
    websiteProjectRepository,
    cacheService as unknown as CacheService,
    logger,
  );

  return { service, projectRepository, websiteProjectRepository, cacheService, logger };
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

    it('evicts the cached public listing for every website the project is linked to', async () => {
      const { service, projectRepository, websiteProjectRepository, cacheService } = buildService();

      const existing = buildProject({ id: 'project-a' });

      projectRepository.findByIdAndUserId.mockResolvedValue(existing);
      projectRepository.update.mockResolvedValue(existing);
      websiteProjectRepository.findWebsiteIdsByProjectId.mockResolvedValue(['website-a', 'website-b']);

      await service.update('project-a', 'user-a', { name: 'Renamed project' });

      expect(websiteProjectRepository.findWebsiteIdsByProjectId).toHaveBeenCalledWith('project-a');
      expect(cacheService.del).toHaveBeenCalledTimes(2);
      expect(cacheService.del).toHaveBeenCalledWith('website:website-a:projects');
      expect(cacheService.del).toHaveBeenCalledWith('website:website-b:projects');
    });

    it('does not evict any cache when the project is not linked to any website', async () => {
      const { service, projectRepository, websiteProjectRepository, cacheService } = buildService();

      const existing = buildProject({ id: 'project-a' });

      projectRepository.findByIdAndUserId.mockResolvedValue(existing);
      projectRepository.update.mockResolvedValue(existing);
      websiteProjectRepository.findWebsiteIdsByProjectId.mockResolvedValue([]);

      await service.update('project-a', 'user-a', { name: 'Renamed project' });

      expect(cacheService.del).not.toHaveBeenCalled();
    });

    it('does not evict any cache when the update fails because the project does not belong to the user', async () => {
      const { service, projectRepository, cacheService } = buildService();

      projectRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.update('project-a', 'user-a', { name: 'Renamed project' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(cacheService.del).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes a project owned by the user', async () => {
      const { service, projectRepository } = buildService();

      projectRepository.delete.mockResolvedValue(true);

      await service.delete('project-a', 'user-a');

      expect(projectRepository.delete).toHaveBeenCalledWith('project-a', 'user-a');
    });

    it('evicts the cached public listing for every website the project was linked to', async () => {
      const { service, projectRepository, websiteProjectRepository, cacheService } = buildService();

      websiteProjectRepository.findWebsiteIdsByProjectId.mockResolvedValue(['website-a', 'website-b']);
      projectRepository.delete.mockResolvedValue(true);

      await service.delete('project-a', 'user-a');

      expect(cacheService.del).toHaveBeenCalledTimes(2);
      expect(cacheService.del).toHaveBeenCalledWith('website:website-a:projects');
      expect(cacheService.del).toHaveBeenCalledWith('website:website-b:projects');
    });

    it('looks up linked websiteIds before deleting, since the join rows cascade-delete with the project', async () => {
      const { service, projectRepository, websiteProjectRepository } = buildService();

      const callOrder: string[] = [];

      websiteProjectRepository.findWebsiteIdsByProjectId.mockImplementation(async () => {
        await Promise.resolve();
        callOrder.push('findWebsiteIdsByProjectId');
        return ['website-a'];
      });
      projectRepository.delete.mockImplementation(async () => {
        await Promise.resolve();
        callOrder.push('delete');
        return true;
      });

      await service.delete('project-a', 'user-a');

      expect(callOrder).toEqual(['findWebsiteIdsByProjectId', 'delete']);
    });

    it('throws NotFoundException and does not evict any cache when the project does not belong to the user', async () => {
      const { service, projectRepository, websiteProjectRepository, cacheService } = buildService();

      websiteProjectRepository.findWebsiteIdsByProjectId.mockResolvedValue(['website-a']);
      projectRepository.delete.mockResolvedValue(false);

      await expect(service.delete('project-a', 'user-a')).rejects.toBeInstanceOf(NotFoundException);
      expect(cacheService.del).not.toHaveBeenCalled();
    });
  });
});
