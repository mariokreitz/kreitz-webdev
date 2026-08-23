import type { IProjectRepository } from '@app/database/interfaces/project.repository.interface';
import type { IWebsiteProjectRepository } from '@app/database/interfaces/website-project.repository.interface';
import type { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';
import type { ProjectRecord } from '@app/database/types/project.types';
import type { WebsiteProjectRecord, WebsiteProjectWithProjectRecord } from '@app/database/types/website-project.types';
import type { WebsiteRecord } from '@app/database/types/website.repository.types';
import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';

import { WebsiteProjectService } from '../website-project.service';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function buildWebsite(overrides: Partial<WebsiteRecord> = {}): WebsiteRecord {
  return {
    id: 'website-a',
    userId: 'user-a',
    name: 'Website A',
    slug: 'website-a',
    enabled: true,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

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

function buildLink(overrides: Partial<WebsiteProjectRecord> = {}): WebsiteProjectRecord {
  return {
    id: 'link-a',
    websiteId: 'website-a',
    projectId: 'project-a',
    published: false,
    sortOrder: 0,
    createdAt: NOW,
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
  service: WebsiteProjectService;
  websiteRepository: jest.Mocked<IWebsiteRepository>;
  projectRepository: jest.Mocked<IProjectRepository>;
  websiteProjectRepository: jest.Mocked<IWebsiteProjectRepository>;
  logger: jest.Mocked<PinoLogger>;
} {
  const websiteRepository: jest.Mocked<IWebsiteRepository> = {
    findById: jest.fn(),
    findByIdAndUserId: jest.fn(),
    findBySlug: jest.fn(),
    findByDomain: jest.fn(),
    findManyByUserId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

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
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const logger = buildLogger();

  const service = new WebsiteProjectService(websiteRepository, projectRepository, websiteProjectRepository, logger);

  return { service, websiteRepository, projectRepository, websiteProjectRepository, logger };
}

describe('WebsiteProjectService', () => {
  describe('create', () => {
    it('links a project owned by the user to a website owned by the user', async () => {
      const { service, websiteRepository, projectRepository, websiteProjectRepository } = buildService();

      websiteRepository.findByIdAndUserId.mockResolvedValue(buildWebsite());
      projectRepository.findByIdAndUserId.mockResolvedValue(buildProject());
      websiteProjectRepository.findByWebsiteAndProject.mockResolvedValue(null);
      websiteProjectRepository.create.mockResolvedValue(buildLink());

      const result = await service.create('website-a', 'user-a', 'project-a', true, 2);

      expect(websiteProjectRepository.create).toHaveBeenCalledWith({
        websiteId: 'website-a',
        projectId: 'project-a',
        published: true,
        sortOrder: 2,
      });
      expect(result).toEqual(buildLink());
    });

    it('omits published and sortOrder from the create payload when they were not provided', async () => {
      const { service, websiteRepository, projectRepository, websiteProjectRepository } = buildService();

      websiteRepository.findByIdAndUserId.mockResolvedValue(buildWebsite());
      projectRepository.findByIdAndUserId.mockResolvedValue(buildProject());
      websiteProjectRepository.findByWebsiteAndProject.mockResolvedValue(null);
      websiteProjectRepository.create.mockResolvedValue(buildLink());

      await service.create('website-a', 'user-a', 'project-a', undefined, undefined);

      expect(websiteProjectRepository.create).toHaveBeenCalledWith({
        websiteId: 'website-a',
        projectId: 'project-a',
      });
    });

    it('throws ConflictException when the website/project pair is already linked', async () => {
      const { service, websiteRepository, projectRepository, websiteProjectRepository } = buildService();

      websiteRepository.findByIdAndUserId.mockResolvedValue(buildWebsite());
      projectRepository.findByIdAndUserId.mockResolvedValue(buildProject());
      websiteProjectRepository.findByWebsiteAndProject.mockResolvedValue(buildLink());

      await expect(service.create('website-a', 'user-a', 'project-a', undefined, undefined)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(websiteProjectRepository.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the website does not belong to the user', async () => {
      const { service, websiteRepository, projectRepository, websiteProjectRepository } = buildService();

      websiteRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.create('website-a', 'user-a', 'project-a', undefined, undefined)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(projectRepository.findByIdAndUserId).not.toHaveBeenCalled();
      expect(websiteProjectRepository.create).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the project does not belong to the user, hiding cross-tenant existence', async () => {
      const { service, websiteRepository, projectRepository, websiteProjectRepository } = buildService();

      websiteRepository.findByIdAndUserId.mockResolvedValue(buildWebsite());
      projectRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.create('website-a', 'user-a', 'project-a', undefined, undefined)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(websiteProjectRepository.findByWebsiteAndProject).not.toHaveBeenCalled();
      expect(websiteProjectRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('getAllForUser', () => {
    it('returns all links for a website owned by the user', async () => {
      const { service, websiteRepository, websiteProjectRepository } = buildService();

      const withProject: WebsiteProjectWithProjectRecord = { ...buildLink(), project: buildProject() };

      websiteRepository.findByIdAndUserId.mockResolvedValue(buildWebsite());
      websiteProjectRepository.findManyByWebsiteId.mockResolvedValue([withProject]);

      const result = await service.getAllForUser('website-a', 'user-a');

      expect(result).toEqual([withProject]);
      expect(websiteProjectRepository.findManyByWebsiteId).toHaveBeenCalledWith('website-a');
    });

    it('throws NotFoundException when the website does not belong to the user', async () => {
      const { service, websiteRepository, websiteProjectRepository } = buildService();

      websiteRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.getAllForUser('website-a', 'user-a')).rejects.toBeInstanceOf(NotFoundException);
      expect(websiteProjectRepository.findManyByWebsiteId).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates published and sortOrder for an existing link', async () => {
      const { service, websiteRepository, websiteProjectRepository } = buildService();

      websiteRepository.findByIdAndUserId.mockResolvedValue(buildWebsite());
      websiteProjectRepository.findByWebsiteAndProject.mockResolvedValue(buildLink());
      websiteProjectRepository.update.mockResolvedValue(buildLink({ published: true, sortOrder: 5 }));

      const result = await service.update('website-a', 'project-a', 'user-a', { published: true, sortOrder: 5 });

      expect(websiteProjectRepository.update).toHaveBeenCalledWith('link-a', 'website-a', {
        published: true,
        sortOrder: 5,
      });
      expect(result).toEqual(buildLink({ published: true, sortOrder: 5 }));
    });

    it('throws NotFoundException when no link exists for the website/project pair', async () => {
      const { service, websiteRepository, websiteProjectRepository } = buildService();

      websiteRepository.findByIdAndUserId.mockResolvedValue(buildWebsite());
      websiteProjectRepository.findByWebsiteAndProject.mockResolvedValue(null);

      await expect(service.update('website-a', 'project-a', 'user-a', { published: true })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(websiteProjectRepository.update).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the website does not belong to the user', async () => {
      const { service, websiteRepository, websiteProjectRepository } = buildService();

      websiteRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.update('website-a', 'project-a', 'user-a', { published: true })).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(websiteProjectRepository.findByWebsiteAndProject).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('unlinks a project from a website', async () => {
      const { service, websiteRepository, websiteProjectRepository } = buildService();

      websiteRepository.findByIdAndUserId.mockResolvedValue(buildWebsite());
      websiteProjectRepository.findByWebsiteAndProject.mockResolvedValue(buildLink());
      websiteProjectRepository.delete.mockResolvedValue(true);

      await service.delete('website-a', 'project-a', 'user-a');

      expect(websiteProjectRepository.delete).toHaveBeenCalledWith('link-a', 'website-a');
    });

    it('throws NotFoundException when no link exists for the website/project pair', async () => {
      const { service, websiteRepository, websiteProjectRepository } = buildService();

      websiteRepository.findByIdAndUserId.mockResolvedValue(buildWebsite());
      websiteProjectRepository.findByWebsiteAndProject.mockResolvedValue(null);

      await expect(service.delete('website-a', 'project-a', 'user-a')).rejects.toBeInstanceOf(NotFoundException);
      expect(websiteProjectRepository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the website does not belong to the user', async () => {
      const { service, websiteRepository, websiteProjectRepository } = buildService();

      websiteRepository.findByIdAndUserId.mockResolvedValue(null);

      await expect(service.delete('website-a', 'project-a', 'user-a')).rejects.toBeInstanceOf(NotFoundException);
      expect(websiteProjectRepository.findByWebsiteAndProject).not.toHaveBeenCalled();
    });
  });
});
