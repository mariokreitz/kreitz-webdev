import type { ProjectRecord } from '@app/database/types/project.types';
import type { GithubRepoSummaryResponse } from '@app/modules/github-import/dto/github-repo-summary.response';
import type { ImportGithubRepoDto } from '@app/modules/github-import/dto/import-github-repo.dto';
import { ProjectDto } from '@app/modules/project';
import { ConflictException } from '@nestjs/common';
import type { UserSession } from '@thallesp/nestjs-better-auth';

import { GithubImportController } from '../github-import.controller';
import type { GithubImportService } from '../github-import.service';

const NOW = new Date('2026-01-01T00:00:00.000Z');

function buildSession(overrides: Partial<UserSession['user']> = {}): UserSession {
  return {
    user: { id: 'user-a', ...overrides },
  } as UserSession;
}

function buildRepoSummary(overrides: Partial<GithubRepoSummaryResponse> = {}): GithubRepoSummaryResponse {
  return {
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

function buildImportDto(overrides: Partial<ImportGithubRepoDto> = {}): ImportGithubRepoDto {
  return {
    githubId: '123',
    owner: 'mariokreitz',
    repo: 'my-project',
    ...overrides,
  };
}

interface MockedGithubImportService {
  listRepos: jest.Mock<Promise<GithubRepoSummaryResponse[]>, [string]>;
  importRepo: jest.Mock<Promise<ProjectRecord>, [string, string, string, string]>;
}

function buildController(): {
  controller: GithubImportController;
  githubImportService: MockedGithubImportService;
} {
  const githubImportService: MockedGithubImportService = {
    listRepos: jest.fn<Promise<GithubRepoSummaryResponse[]>, [string]>(),
    importRepo: jest.fn<Promise<ProjectRecord>, [string, string, string, string]>(),
  };

  const controller = new GithubImportController(githubImportService as unknown as GithubImportService);

  return { controller, githubImportService };
}

describe('GithubImportController', () => {
  describe('listRepos', () => {
    it('delegates to GithubImportService.listRepos with the session user id and returns its result', async () => {
      const { controller, githubImportService } = buildController();
      const summaries = [buildRepoSummary()];
      githubImportService.listRepos.mockResolvedValue(summaries);

      const result = await controller.listRepos(buildSession());

      expect(githubImportService.listRepos).toHaveBeenCalledWith('user-a');
      expect(result).toBe(summaries);
    });
  });

  describe('import', () => {
    it('delegates to GithubImportService.importRepo with the dto fields and session user id, and maps the result through ProjectDto', async () => {
      const { controller, githubImportService } = buildController();
      const record = buildProjectRecord();
      githubImportService.importRepo.mockResolvedValue(record);

      const result = await controller.import(buildImportDto(), buildSession());

      expect(githubImportService.importRepo).toHaveBeenCalledWith('user-a', '123', 'mariokreitz', 'my-project');
      expect(result).toEqual(ProjectDto.fromRecord(record));
    });

    it('propagates errors from GithubImportService.importRepo', async () => {
      const { controller, githubImportService } = buildController();
      githubImportService.importRepo.mockRejectedValue(
        new ConflictException('This GitHub project is already imported'),
      );

      await expect(controller.import(buildImportDto(), buildSession())).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
