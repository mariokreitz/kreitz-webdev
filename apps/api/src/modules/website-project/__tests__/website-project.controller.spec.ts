import { SKIP_RESPONSE_ENVELOPE_KEY } from '@app/common/constants/response.constants';
import type { ProjectRecord } from '@app/database/types/project.types';
import type { WebsiteProjectRecord, WebsiteProjectWithProjectRecord } from '@app/database/types/website-project.types';
import type { UserSession } from '@thallesp/nestjs-better-auth';

import { CreateWebsiteProjectDto } from '../dto/create-website-project.dto';
import { UpdateWebsiteProjectDto } from '../dto/update-website-project.dto';
import { WebsiteProjectDto, WebsiteProjectWithProjectDto } from '../dto/website-project.dto';
import { WebsiteProjectController } from '../website-project.controller';
import type { WebsiteProjectService } from '../website-project.service';

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
    category: null,
    githubStars: null,
    githubCreatedAt: null,
    githubUpdatedAt: null,
    lastSyncedAt: null,
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

function buildSession(userId = 'session-user-id'): UserSession {
  return { user: { id: userId } } as unknown as UserSession;
}

interface MockedWebsiteProjectService {
  getAllForUser: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
}

function buildController(): {
  controller: WebsiteProjectController;
  websiteProjectService: MockedWebsiteProjectService;
} {
  const websiteProjectService: MockedWebsiteProjectService = {
    getAllForUser: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const controller = new WebsiteProjectController(websiteProjectService as unknown as WebsiteProjectService);

  return { controller, websiteProjectService };
}

describe('WebsiteProjectController', () => {
  describe('getAll', () => {
    it('returns links mapped to WebsiteProjectWithProjectDto instances', async () => {
      const { controller, websiteProjectService } = buildController();

      const withProject: WebsiteProjectWithProjectRecord = { ...buildLink(), project: buildProject() };
      websiteProjectService.getAllForUser.mockResolvedValue([withProject]);

      const result = await controller.getAll('website-a', buildSession('user-a'));

      expect(websiteProjectService.getAllForUser).toHaveBeenCalledWith('website-a', 'user-a');
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(WebsiteProjectWithProjectDto);
      expect(result[0]).toEqual({
        id: 'link-a',
        websiteId: 'website-a',
        projectId: 'project-a',
        published: false,
        sortOrder: 0,
        createdAt: NOW,
        updatedAt: NOW,
        project: {
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
          category: null,
          githubStars: null,
          githubCreatedAt: null,
          githubUpdatedAt: null,
          lastSyncedAt: null,
          importedAt: NOW,
          updatedAt: NOW,
        },
      });
    });

    it('returns an empty array when the service returns no links', async () => {
      const { controller, websiteProjectService } = buildController();

      websiteProjectService.getAllForUser.mockResolvedValue([]);

      const result = await controller.getAll('website-a', buildSession('user-a'));

      expect(result).toEqual([]);
    });

    it('propagates a rejection from the service unchanged', async () => {
      const { controller, websiteProjectService } = buildController();

      const error = new Error('boom');
      websiteProjectService.getAllForUser.mockRejectedValue(error);

      await expect(controller.getAll('website-a', buildSession('user-a'))).rejects.toBe(error);
    });
  });

  describe('create', () => {
    it('forwards the websiteId, userId and DTO fields to the service in the expected order', async () => {
      const { controller, websiteProjectService } = buildController();

      const dto = new CreateWebsiteProjectDto();
      dto.projectId = 'project-a';
      dto.published = true;
      dto.sortOrder = 2;

      websiteProjectService.create.mockResolvedValue(buildLink({ published: true, sortOrder: 2 }));

      await controller.create('website-a', dto, buildSession('user-a'));

      expect(websiteProjectService.create).toHaveBeenCalledWith('website-a', 'user-a', 'project-a', true, 2);
    });

    it('forwards undefined published and sortOrder when the DTO omits them', async () => {
      const { controller, websiteProjectService } = buildController();

      const dto = new CreateWebsiteProjectDto();
      dto.projectId = 'project-a';

      websiteProjectService.create.mockResolvedValue(buildLink());

      await controller.create('website-a', dto, buildSession('user-a'));

      expect(websiteProjectService.create).toHaveBeenCalledWith(
        'website-a',
        'user-a',
        'project-a',
        undefined,
        undefined,
      );
    });

    it('returns the created link mapped to a WebsiteProjectDto instance', async () => {
      const { controller, websiteProjectService } = buildController();

      const dto = new CreateWebsiteProjectDto();
      dto.projectId = 'project-a';

      websiteProjectService.create.mockResolvedValue(buildLink());

      const result = await controller.create('website-a', dto, buildSession('user-a'));

      expect(result).toBeInstanceOf(WebsiteProjectDto);
      expect(result).toEqual({
        id: 'link-a',
        websiteId: 'website-a',
        projectId: 'project-a',
        published: false,
        sortOrder: 0,
        createdAt: NOW,
        updatedAt: NOW,
      });
    });

    it('propagates a rejection from the service unchanged', async () => {
      const { controller, websiteProjectService } = buildController();

      const dto = new CreateWebsiteProjectDto();
      dto.projectId = 'project-a';

      const error = new Error('boom');
      websiteProjectService.create.mockRejectedValue(error);

      await expect(controller.create('website-a', dto, buildSession('user-a'))).rejects.toBe(error);
    });
  });

  describe('update', () => {
    it('forwards websiteId, projectId, userId and the DTO to the service in the expected order', async () => {
      const { controller, websiteProjectService } = buildController();

      const dto = new UpdateWebsiteProjectDto();
      dto.published = true;
      dto.sortOrder = 5;

      websiteProjectService.update.mockResolvedValue(buildLink({ published: true, sortOrder: 5 }));

      await controller.update('website-a', 'project-a', dto, buildSession('user-a'));

      expect(websiteProjectService.update).toHaveBeenCalledWith('website-a', 'project-a', 'user-a', dto);
    });

    it('returns the updated link mapped to a WebsiteProjectDto instance', async () => {
      const { controller, websiteProjectService } = buildController();

      const dto = new UpdateWebsiteProjectDto();
      dto.published = true;

      websiteProjectService.update.mockResolvedValue(buildLink({ published: true }));

      const result = await controller.update('website-a', 'project-a', dto, buildSession('user-a'));

      expect(result).toBeInstanceOf(WebsiteProjectDto);
      expect(result).toEqual({
        id: 'link-a',
        websiteId: 'website-a',
        projectId: 'project-a',
        published: true,
        sortOrder: 0,
        createdAt: NOW,
        updatedAt: NOW,
      });
    });

    it('propagates a rejection from the service unchanged', async () => {
      const { controller, websiteProjectService } = buildController();

      const dto = new UpdateWebsiteProjectDto();

      const error = new Error('boom');
      websiteProjectService.update.mockRejectedValue(error);

      await expect(controller.update('website-a', 'project-a', dto, buildSession('user-a'))).rejects.toBe(error);
    });
  });

  describe('delete', () => {
    it('forwards websiteId, projectId and userId to the service', async () => {
      const { controller, websiteProjectService } = buildController();

      websiteProjectService.delete.mockResolvedValue(undefined);

      await controller.delete('website-a', 'project-a', buildSession('user-a'));

      expect(websiteProjectService.delete).toHaveBeenCalledWith('website-a', 'project-a', 'user-a');
    });

    it('resolves with undefined', async () => {
      const { controller, websiteProjectService } = buildController();

      websiteProjectService.delete.mockResolvedValue(undefined);

      await expect(controller.delete('website-a', 'project-a', buildSession('user-a'))).resolves.toBeUndefined();
    });

    it('propagates a rejection from the service unchanged', async () => {
      const { controller, websiteProjectService } = buildController();

      const error = new Error('boom');
      websiteProjectService.delete.mockRejectedValue(error);

      await expect(controller.delete('website-a', 'project-a', buildSession('user-a'))).rejects.toBe(error);
    });

    it('skips the response envelope, since it returns no body', () => {
      const deleteHandler = Reflect.get(WebsiteProjectController.prototype, 'delete');
      const skipsEnvelope: unknown = Reflect.getMetadata(SKIP_RESPONSE_ENVELOPE_KEY, deleteHandler);

      expect(skipsEnvelope).toBe(true);
    });
  });
});
