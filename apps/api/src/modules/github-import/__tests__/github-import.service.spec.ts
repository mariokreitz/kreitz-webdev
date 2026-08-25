import type { CacheService } from '@app/database/cache';
import type { IGithubAccountRepository } from '@app/database/interfaces/github-account.repository.interface';
import type { GithubLinkedAccount } from '@app/database/types/github-account.types';
import type { ProjectRecord } from '@app/database/types/project.types';
import type { ProjectService } from '@app/modules/project';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import type { AuthService } from '@thallesp/nestjs-better-auth';
import type { PinoLogger } from 'nestjs-pino';

import type { GithubApiService } from '../github-api.service';
import { GithubImportService } from '../github-import.service';
import type { GithubRepoApiResponse } from '../types/github-api.types';
import { buildGithubReposCacheKey } from '../utils/github-import.utils';

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
    pushed_at: '2025-12-30T00:00:00.000Z',
    created_at: '2025-01-01T00:00:00.000Z',
    stargazers_count: 42,
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
    category: null,
    githubStars: 42,
    githubCreatedAt: new Date('2025-01-01T00:00:00.000Z'),
    githubUpdatedAt: new Date('2025-12-30T00:00:00.000Z'),
    lastSyncedAt: NOW,
    importedAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function buildLogger(): MockedLogger {
  return {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

interface MockedGithubApiService {
  listUserRepos: jest.Mock<Promise<GithubRepoApiResponse[]>, [string]>;
  getRepo: jest.Mock<Promise<GithubRepoApiResponse>, [string, string, string]>;
}

interface MockedProjectService {
  create: jest.Mock<Promise<ProjectRecord>, [unknown]>;
  getByIdForUser: jest.Mock<Promise<ProjectRecord>, [string, string]>;
  update: jest.Mock<Promise<ProjectRecord>, [string, string, unknown]>;
}

interface MockedLogger {
  setContext: jest.Mock;
  info: jest.Mock;
  warn: jest.Mock;
}

interface MockedCacheService {
  get: jest.Mock;
  set: jest.Mock;
  del: jest.Mock;
  getOrSet: jest.Mock;
}

// WHY: a real map-backed fake (not a bare jest.fn) is needed to actually exercise "hit skips the loader" behavior, not just that getOrSet was called with the right arguments.
function buildCacheService(): { cacheService: MockedCacheService; store: Map<string, unknown> } {
  const store = new Map<string, unknown>();

  const cacheService: MockedCacheService = {
    get: jest.fn((key: string) => store.get(key)),
    set: jest.fn((key: string, value: unknown) => {
      store.set(key, value);
    }),
    del: jest.fn((key: string) => {
      store.delete(key);
    }),
    getOrSet: jest.fn(async (key: string, _ttlMs: number | undefined, loader: () => Promise<unknown>) => {
      if (store.has(key)) {
        return store.get(key);
      }

      const value = await loader();
      store.set(key, value);

      return value;
    }),
  };

  return { cacheService, store };
}

function buildService(): {
  service: GithubImportService;
  githubAccountRepository: jest.Mocked<IGithubAccountRepository>;
  githubApiService: MockedGithubApiService;
  projectService: MockedProjectService;
  cacheService: MockedCacheService;
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
    getByIdForUser: jest.fn<Promise<ProjectRecord>, [string, string]>(),
    update: jest.fn<Promise<ProjectRecord>, [string, string, unknown]>(),
  };

  const { cacheService } = buildCacheService();

  const getAccessToken = jest.fn();
  const authService = { api: { getAccessToken } } as unknown as AuthService;

  const logger = buildLogger();

  const service = new GithubImportService(
    githubAccountRepository,
    githubApiService as unknown as GithubApiService,
    projectService as unknown as ProjectService,
    cacheService as unknown as CacheService,
    authService,
    logger as unknown as PinoLogger,
  );

  return { service, githubAccountRepository, githubApiService, projectService, cacheService, getAccessToken, logger };
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

    describe('caching', () => {
      it('caches the result under a per-user key and skips GitHub on a second read', async () => {
        const { service, githubAccountRepository, githubApiService, getAccessToken, cacheService } = buildService();

        githubAccountRepository.findByUserId.mockResolvedValue(buildAccount());
        getAccessToken.mockResolvedValue({ accessToken: 'token-a' });
        githubApiService.listUserRepos.mockResolvedValue([buildRepo()]);

        await service.listRepos('user-a');
        await service.listRepos('user-a');

        expect(githubApiService.listUserRepos).toHaveBeenCalledTimes(1);
        expect(cacheService.getOrSet).toHaveBeenCalledWith(
          buildGithubReposCacheKey('user-a'),
          expect.any(Number),
          expect.any(Function),
        );
      });

      it('fetches independently for different users', async () => {
        const { service, githubAccountRepository, githubApiService, getAccessToken } = buildService();

        githubAccountRepository.findByUserId.mockResolvedValue(buildAccount());
        getAccessToken.mockResolvedValue({ accessToken: 'token-a' });
        githubApiService.listUserRepos.mockResolvedValue([buildRepo()]);

        await service.listRepos('user-a');
        await service.listRepos('user-b');

        expect(githubApiService.listUserRepos).toHaveBeenCalledTimes(2);
      });
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
        githubStars: 42,
        githubCreatedAt: new Date('2025-01-01T00:00:00.000Z'),
        githubUpdatedAt: new Date('2025-12-30T00:00:00.000Z'),
        lastSyncedAt: expect.any(Date) as Date,
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

    it('throws BadRequestException and logs a rejection when the fetched repo id does not match the claimed githubId', async () => {
      const { service, githubAccountRepository, githubApiService, projectService, getAccessToken, logger } =
        buildService();

      githubAccountRepository.findByUserId.mockResolvedValue(buildAccount());
      getAccessToken.mockResolvedValue({ accessToken: 'token-a' });
      githubApiService.getRepo.mockResolvedValue(buildRepo({ id: 999 }));

      await expect(service.importRepo('user-a', '123', 'mariokreitz', 'my-project')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(projectService.create).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith({
        event: 'github_import.rejected',
        reason: 'github_id_mismatch',
        userId: 'user-a',
        githubId: '123',
        fetchedGithubId: '999',
      });
    });

    it('throws BadRequestException and logs a rejection when the fetched repo does not belong to the linked GitHub account', async () => {
      const { service, githubAccountRepository, githubApiService, projectService, getAccessToken, logger } =
        buildService();

      githubAccountRepository.findByUserId.mockResolvedValue(buildAccount({ accountId: '111111' }));
      getAccessToken.mockResolvedValue({ accessToken: 'token-a' });
      githubApiService.getRepo.mockResolvedValue(buildRepo({ owner: { id: 999999, login: 'someone-else' } }));

      await expect(service.importRepo('user-a', '123', 'someone-else', 'my-project')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(projectService.create).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith({
        event: 'github_import.rejected',
        reason: 'owner_mismatch',
        userId: 'user-a',
        linkedAccountId: '111111',
        fetchedOwnerId: '999999',
      });
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

  describe('refreshRepo', () => {
    it('re-fetches the linked repo and updates the stored GitHub metadata', async () => {
      const { service, githubAccountRepository, githubApiService, projectService, getAccessToken, logger } =
        buildService();

      projectService.getByIdForUser.mockResolvedValue(buildProjectRecord());
      githubAccountRepository.findByUserId.mockResolvedValue(buildAccount());
      getAccessToken.mockResolvedValue({ accessToken: 'token-a' });
      githubApiService.getRepo.mockResolvedValue(buildRepo({ stargazers_count: 100 }));
      projectService.update.mockResolvedValue(buildProjectRecord({ githubStars: 100 }));

      const result = await service.refreshRepo('user-a', 'project-a');

      expect(projectService.getByIdForUser).toHaveBeenCalledWith('project-a', 'user-a');
      expect(githubApiService.getRepo).toHaveBeenCalledWith('token-a', 'mariokreitz', 'my-project');
      expect(projectService.update).toHaveBeenCalledWith('project-a', 'user-a', {
        githubStars: 100,
        githubCreatedAt: new Date('2025-01-01T00:00:00.000Z'),
        githubUpdatedAt: new Date('2025-12-30T00:00:00.000Z'),
        lastSyncedAt: expect.any(Date) as Date,
      });
      expect(result).toEqual(buildProjectRecord({ githubStars: 100 }));
      expect(logger.info).toHaveBeenCalledWith({
        event: 'github_import.refreshed',
        userId: 'user-a',
        projectId: 'project-a',
      });
    });

    it('throws BadRequestException when the project is not linked to a GitHub repository', async () => {
      const { service, projectService, githubApiService } = buildService();

      projectService.getByIdForUser.mockResolvedValue(
        buildProjectRecord({ githubId: null, githubOwner: null, githubRepo: null }),
      );

      await expect(service.refreshRepo('user-a', 'project-a')).rejects.toBeInstanceOf(BadRequestException);
      expect(githubApiService.getRepo).not.toHaveBeenCalled();
    });

    it('propagates NotFoundException when the project does not belong to the user', async () => {
      const { service, projectService } = buildService();

      projectService.getByIdForUser.mockRejectedValue(new NotFoundException('Project not found'));

      await expect(service.refreshRepo('user-a', 'project-a')).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws BadRequestException and does not update when the fetched repo id no longer matches the stored githubId', async () => {
      const { service, githubAccountRepository, githubApiService, projectService, getAccessToken, logger } =
        buildService();

      projectService.getByIdForUser.mockResolvedValue(buildProjectRecord());
      githubAccountRepository.findByUserId.mockResolvedValue(buildAccount());
      getAccessToken.mockResolvedValue({ accessToken: 'token-a' });
      githubApiService.getRepo.mockResolvedValue(buildRepo({ id: 999 }));

      await expect(service.refreshRepo('user-a', 'project-a')).rejects.toBeInstanceOf(BadRequestException);
      expect(projectService.update).not.toHaveBeenCalled();
      expect(logger.warn).toHaveBeenCalledWith({
        event: 'github_import.rejected',
        reason: 'github_id_mismatch',
        userId: 'user-a',
        projectId: 'project-a',
        githubId: '123',
        fetchedGithubId: '999',
      });
    });
  });
});
