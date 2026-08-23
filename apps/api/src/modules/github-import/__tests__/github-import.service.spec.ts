import type { IGithubAccountRepository } from '@app/database/interfaces/github-account.repository.interface';
import type { GithubLinkedAccount } from '@app/database/types/github-account.types';
import type { ProjectRecord } from '@app/database/types/project.types';
import type { ProjectService } from '@app/modules/project/project.service';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { AuthService } from '@thallesp/nestjs-better-auth';
import type { PinoLogger } from 'nestjs-pino';

import type { GithubApiService } from '../github-api.service';
import { GithubImportService } from '../github-import.service';
import type { GithubRepoApiResponse } from '../types/github-api.types';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function buildAccount(overrides: Partial<GithubLinkedAccount> = {}): GithubLinkedAccount {
  return {
    id: 'account-a',
    accountId: '999999',
    ...overrides,
  };
}

function buildRepo(overrides: Partial<GithubRepoApiResponse> = {}): GithubRepoApiResponse {
  return {
    id: 123,
    name: 'my-project',
    full_name: 'mariokreitz/my-project',
    html_url: 'https://github.com/mariokreitz/my-project',
    description: 'A project description',
    homepage: 'https://myproject.dev',
    language: 'TypeScript',
    topics: ['cli'],
    private: false,
    updated_at: '2026-01-01T00:00:00.000Z',
    owner: { id: 999999, login: 'mariokreitz' },
    ...overrides,
  };
}

function buildProjectRecord(overrides: Partial<ProjectRecord> = {}): ProjectRecord {
  return {
    id: 'project-a',
    userId: 'user-a',
    githubId: '123',
    githubOwner: 'mariokreitz',
    githubRepo: 'my-project',
    name: 'my-project',
    description: 'A project description',
    repoUrl: 'https://github.com/mariokreitz/my-project',
    liveUrl: 'https://myproject.dev',
    tags: ['TypeScript', 'cli'],
    imageUrl: null,
    importedAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildLogger(): MockedLogger {
  return {
    setContext: jest.fn(),
    info: jest.fn(),
  };
}

interface MockedGithubApiService {
  listUserRepos: jest.Mock<Promise<GithubRepoApiResponse[]>, [string]>;
  getRepo: jest.Mock<Promise<GithubRepoApiResponse>, [string, string, string]>;
}

interface MockedProjectService {
  create: jest.Mock<Promise<ProjectRecord>, [unknown]>;
}

interface MockedLogger {
  setContext: jest.Mock;
  info: jest.Mock;
}

function buildService(): {
  service: GithubImportService;
  githubAccountRepository: jest.Mocked<IGithubAccountRepository>;
  githubApiService: MockedGithubApiService;
  projectService: MockedProjectService;
  getAccessToken: jest.Mock;
  logger: MockedLogger;
} {
  const githubAccountRepository: jest.Mocked<IGithubAccountRepository> = {
    findByUserId: jest.fn(),
  };

  const githubApiService: MockedGithubApiService = {
    listUserRepos: jest.fn<Promise<GithubRepoApiResponse[]>, [string]>(),
    getRepo: jest.fn<Promise<GithubRepoApiResponse>, [string, string, string]>(),
  };

  const projectService: MockedProjectService = {
    create: jest.fn<Promise<ProjectRecord>, [unknown]>(),
  };

  const getAccessToken = jest.fn();
  const authService = { api: { getAccessToken } } as unknown as AuthService;

  const logger = buildLogger();

  const service = new GithubImportService(
    githubAccountRepository,
    githubApiService as unknown as GithubApiService,
    projectService as unknown as ProjectService,
    authService,
    logger as unknown as PinoLogger,
  );

  return { service, githubAccountRepository, githubApiService, projectService, getAccessToken, logger };
}

describe('GithubImportService', () => {
  describe('listRepos', () => {
    it('returns the mapped repo summaries for the linked account', async () => {
      const { service, githubAccountRepository, githubApiService, getAccessToken } = buildService();

      githubAccountRepository.findByUserId.mockResolvedValue(buildAccount());
      getAccessToken.mockResolvedValue({ accessToken: 'token-a' });
      githubApiService.listUserRepos.mockResolvedValue([buildRepo()]);

      const result = await service.listRepos('user-a');

      expect(getAccessToken).toHaveBeenCalledWith({ body: { accountId: 'account-a', userId: 'user-a' } });
      expect(githubApiService.listUserRepos).toHaveBeenCalledWith('token-a');
      expect(result).toEqual([
        {
          githubId: '123',
          name: 'my-project',
          fullName: 'mariokreitz/my-project',
          htmlUrl: 'https://github.com/mariokreitz/my-project',
          description: 'A project description',
          homepage: 'https://myproject.dev',
          language: 'TypeScript',
          topics: ['cli'],
          private: false,
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
      ]);
    });

    it('throws BadRequestException when the user has no linked GitHub account', async () => {
      const { service, githubAccountRepository, githubApiService } = buildService();

      githubAccountRepository.findByUserId.mockResolvedValue(null);

      await expect(service.listRepos('user-a')).rejects.toBeInstanceOf(BadRequestException);
      expect(githubApiService.listUserRepos).not.toHaveBeenCalled();
    });
  });

  describe('importRepo', () => {
    it('imports a repo and logs the completion event', async () => {
      const { service, githubAccountRepository, githubApiService, projectService, getAccessToken, logger } =
        buildService();

      githubAccountRepository.findByUserId.mockResolvedValue(buildAccount());
      getAccessToken.mockResolvedValue({ accessToken: 'token-a' });
      githubApiService.getRepo.mockResolvedValue(buildRepo());
      projectService.create.mockResolvedValue(buildProjectRecord());

      const result = await service.importRepo('user-a', '123', 'mariokreitz', 'my-project');

      expect(githubApiService.getRepo).toHaveBeenCalledWith('token-a', 'mariokreitz', 'my-project');
      expect(projectService.create).toHaveBeenCalledWith({
        userId: 'user-a',
        githubId: '123',
        githubOwner: 'mariokreitz',
        githubRepo: 'my-project',
        name: 'my-project',
        description: 'A project description',
        repoUrl: 'https://github.com/mariokreitz/my-project',
        liveUrl: 'https://myproject.dev',
        tags: ['TypeScript', 'cli'],
      });
      expect(result).toEqual(buildProjectRecord());
      expect(logger.info).toHaveBeenCalledWith({
        event: 'github_import.completed',
        userId: 'user-a',
        projectId: 'project-a',
        githubId: '123',
      });
    });

    it('throws BadRequestException when the user has no linked GitHub account', async () => {
      const { service, githubAccountRepository, githubApiService } = buildService();

      githubAccountRepository.findByUserId.mockResolvedValue(null);

      await expect(service.importRepo('user-a', '123', 'mariokreitz', 'my-project')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(githubApiService.getRepo).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the fetched repo id does not match the claimed githubId', async () => {
      const { service, githubAccountRepository, githubApiService, projectService, getAccessToken } = buildService();

      githubAccountRepository.findByUserId.mockResolvedValue(buildAccount());
      getAccessToken.mockResolvedValue({ accessToken: 'token-a' });
      githubApiService.getRepo.mockResolvedValue(buildRepo({ id: 999 }));

      await expect(service.importRepo('user-a', '123', 'mariokreitz', 'my-project')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(projectService.create).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when the fetched repo does not belong to the linked GitHub account', async () => {
      const { service, githubAccountRepository, githubApiService, projectService, getAccessToken } = buildService();

      githubAccountRepository.findByUserId.mockResolvedValue(buildAccount({ accountId: '111111' }));
      getAccessToken.mockResolvedValue({ accessToken: 'token-a' });
      githubApiService.getRepo.mockResolvedValue(buildRepo({ owner: { id: 999999, login: 'someone-else' } }));

      await expect(service.importRepo('user-a', '123', 'someone-else', 'my-project')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(projectService.create).not.toHaveBeenCalled();
    });

    it('propagates ConflictException from ProjectService.create on a duplicate githubId', async () => {
      const { service, githubAccountRepository, githubApiService, projectService, getAccessToken } = buildService();

      githubAccountRepository.findByUserId.mockResolvedValue(buildAccount());
      getAccessToken.mockResolvedValue({ accessToken: 'token-a' });
      githubApiService.getRepo.mockResolvedValue(buildRepo());
      projectService.create.mockRejectedValue(new ConflictException('This GitHub project is already imported'));

      await expect(service.importRepo('user-a', '123', 'mariokreitz', 'my-project')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('propagates GitHub API errors from GithubApiService.getRepo', async () => {
      const { service, githubAccountRepository, githubApiService, getAccessToken } = buildService();

      githubAccountRepository.findByUserId.mockResolvedValue(buildAccount());
      getAccessToken.mockResolvedValue({ accessToken: 'token-a' });
      githubApiService.getRepo.mockRejectedValue(new NotFoundException('GitHub repository not found'));

      await expect(service.importRepo('user-a', '123', 'mariokreitz', 'my-project')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
