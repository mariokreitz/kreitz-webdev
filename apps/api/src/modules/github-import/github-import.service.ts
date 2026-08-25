import { CacheService } from '@app/database/cache';
import { IGithubAccountRepository } from '@app/database/interfaces/github-account.repository.interface';
import { GithubLinkedAccount } from '@app/database/types/github-account.types';
import { ProjectRecord } from '@app/database/types/project.types';
import { GITHUB_REPOS_CACHE_TTL_MS } from '@app/modules/github-import/constants/github-import.constants';
import { GithubRepoSummaryResponse } from '@app/modules/github-import/dto/github-repo-summary.response';
import { GithubApiService } from '@app/modules/github-import/github-api.service';
import { GITHUB_ACCOUNT_REPOSITORY, GITHUB_AUTH_SERVICE } from '@app/modules/github-import/tokens/github-import.tokens';
import {
  buildGithubReposCacheKey,
  toCreateProjectData,
  toGithubMetadataUpdate,
} from '@app/modules/github-import/utils/github-import.utils';
import { ProjectService } from '@app/modules/project';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { AuthService } from '@thallesp/nestjs-better-auth';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class GithubImportService {
  constructor(
    @Inject(GITHUB_ACCOUNT_REPOSITORY)
    private readonly githubAccountRepository: IGithubAccountRepository,

    private readonly githubApiService: GithubApiService,
    private readonly projectService: ProjectService,
    private readonly cacheService: CacheService,

    @Inject(GITHUB_AUTH_SERVICE)
    private readonly authService: AuthService,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GithubImportService.name);
  }

  public async listRepos(userId: string): Promise<GithubRepoSummaryResponse[]> {
    return this.cacheService.getOrSet(buildGithubReposCacheKey(userId), GITHUB_REPOS_CACHE_TTL_MS, async () => {
      const { accessToken } = await this.resolveLinkedAccount(userId);

      const repos = await this.githubApiService.listUserRepos(accessToken);

      return repos.map((repo) => GithubRepoSummaryResponse.fromApiResponse(repo));
    });
  }

  public async importRepo(userId: string, githubId: string, owner: string, repo: string): Promise<ProjectRecord> {
    const { accessToken, account } = await this.resolveLinkedAccount(userId);

    const fetchedRepo = await this.githubApiService.getRepo(accessToken, owner, repo);

    if (String(fetchedRepo.id) !== githubId) {
      this.logger.warn({
        event: 'github_import.rejected',
        reason: 'github_id_mismatch',
        userId,
        githubId,
        fetchedGithubId: String(fetchedRepo.id),
      });

      throw new BadRequestException('The repository owner/repo does not match the provided githubId');
    }

    if (String(fetchedRepo.owner.id) !== account.accountId) {
      this.logger.warn({
        event: 'github_import.rejected',
        reason: 'owner_mismatch',
        userId,
        linkedAccountId: account.accountId,
        fetchedOwnerId: String(fetchedRepo.owner.id),
      });

      throw new BadRequestException('The repository does not belong to your linked GitHub account');
    }

    const created = await this.projectService.create(toCreateProjectData(userId, fetchedRepo));

    this.logger.info({ event: 'github_import.completed', userId, projectId: created.id, githubId });

    return created;
  }

  public async refreshRepo(userId: string, projectId: string): Promise<ProjectRecord> {
    const project = await this.projectService.getByIdForUser(projectId, userId);

    if (!project.githubOwner || !project.githubRepo || !project.githubId) {
      this.logger.warn({ event: 'github_import.rejected', reason: 'not_github_linked', userId, projectId });

      throw new BadRequestException('This project is not linked to a GitHub repository');
    }

    const { accessToken } = await this.resolveLinkedAccount(userId);

    const fetchedRepo = await this.githubApiService.getRepo(accessToken, project.githubOwner, project.githubRepo);

    if (String(fetchedRepo.id) !== project.githubId) {
      this.logger.warn({
        event: 'github_import.rejected',
        reason: 'github_id_mismatch',
        userId,
        projectId,
        githubId: project.githubId,
        fetchedGithubId: String(fetchedRepo.id),
      });

      throw new BadRequestException('The linked GitHub repository no longer matches the imported project');
    }

    const updated = await this.projectService.update(projectId, userId, toGithubMetadataUpdate(fetchedRepo));

    this.logger.info({ event: 'github_import.refreshed', userId, projectId });

    return updated;
  }

  private async resolveLinkedAccount(userId: string): Promise<{ accessToken: string; account: GithubLinkedAccount }> {
    const account = await this.githubAccountRepository.findByUserId(userId);

    if (!account) {
      throw new BadRequestException('Link your GitHub account first');
    }

    // Omitting `headers`/`request` makes better-call trust the explicit `userId` instead of requiring a session.
    const { accessToken } = await this.authService.api.getAccessToken({
      body: { accountId: account.id, userId },
    });

    return { accessToken, account };
  }
}
