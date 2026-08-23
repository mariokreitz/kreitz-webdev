import { IGithubAccountRepository } from '@app/database/interfaces/github-account.repository.interface';
import { GithubLinkedAccount } from '@app/database/types/github-account.types';
import { ProjectRecord } from '@app/database/types/project.types';
import { GithubRepoSummaryResponse } from '@app/modules/github-import/dto/github-repo-summary.response';
import { GithubApiService } from '@app/modules/github-import/github-api.service';
import { GITHUB_ACCOUNT_REPOSITORY, GITHUB_AUTH_SERVICE } from '@app/modules/github-import/tokens/github-import.tokens';
import { toCreateProjectData, toGithubRepoSummary } from '@app/modules/github-import/utils/github-import.utils';
import { ProjectService } from '@app/modules/project/project.service';
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

    @Inject(GITHUB_AUTH_SERVICE)
    private readonly authService: AuthService,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GithubImportService.name);
  }

  public async listRepos(userId: string): Promise<GithubRepoSummaryResponse[]> {
    const { accessToken } = await this.resolveLinkedAccount(userId);

    const repos = await this.githubApiService.listUserRepos(accessToken);

    return repos.map(toGithubRepoSummary);
  }

  public async importRepo(userId: string, githubId: string, owner: string, repo: string): Promise<ProjectRecord> {
    const { accessToken, account } = await this.resolveLinkedAccount(userId);

    const fetchedRepo = await this.githubApiService.getRepo(accessToken, owner, repo);

    if (String(fetchedRepo.id) !== githubId) {
      throw new BadRequestException('The repository owner/repo does not match the provided githubId');
    }

    if (String(fetchedRepo.owner.id) !== account.accountId) {
      throw new BadRequestException('The repository does not belong to your linked GitHub account');
    }

    const created = await this.projectService.create(toCreateProjectData(userId, fetchedRepo));

    this.logger.info({ event: 'github_import.completed', userId, projectId: created.id, githubId });

    return created;
  }

  private async resolveLinkedAccount(userId: string): Promise<{ accessToken: string; account: GithubLinkedAccount }> {
    const account = await this.githubAccountRepository.findByUserId(userId);

    if (!account) {
      throw new BadRequestException('Link your GitHub account first');
    }

    // No `headers`/`request` is passed, so better-call's resolveUserId falls through to the
    // explicit `userId` instead of requiring a session — this is a trusted server-side call.
    const { accessToken } = await this.authService.api.getAccessToken({
      body: { accountId: account.id, userId },
    });

    return { accessToken, account };
  }
}
