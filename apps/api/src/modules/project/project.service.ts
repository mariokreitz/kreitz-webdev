import { CacheService } from '@app/database/cache';
import { IProjectRepository } from '@app/database/interfaces/project.repository.interface';
import { IWebsiteProjectRepository } from '@app/database/interfaces/website-project.repository.interface';
import { CreateProjectData, ProjectRecord, UpdateProjectData } from '@app/database/types/project.types';
// WHY: importing the website-project barrel here would create a circular module load (WebsiteProjectModule already imports ProjectModule for project-ownership checks); this leaf import breaks the cycle while still letting ProjectService find every website a project is linked to for cache invalidation.
import { WEBSITE_PROJECT_REPOSITORY } from '@app/modules/website-project/tokens/website-project.tokens';
import { buildWebsiteProjectsCacheKey } from '@app/modules/website-project/utils/website-project.utils';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PROJECT_REPOSITORY } from './tokens/project.tokens';
import { normalizeRepoUrl } from './utils/normalize-repo-url';

@Injectable()
export class ProjectService {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,

    @Inject(WEBSITE_PROJECT_REPOSITORY)
    private readonly websiteProjectRepository: IWebsiteProjectRepository,

    private readonly cacheService: CacheService,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProjectService.name);
  }

  public async getAllForUser(userId: string): Promise<ProjectRecord[]> {
    return this.projectRepository.findManyByUserId(userId);
  }

  public async getByIdForUser(id: string, userId: string): Promise<ProjectRecord> {
    const project = await this.projectRepository.findByIdAndUserId(id, userId);

    if (!project) {
      this.logger.warn({ event: 'project.rejected', reason: 'not_found', userId, projectId: id });
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  public async create(input: CreateProjectData): Promise<ProjectRecord> {
    if (input.githubId) {
      const existingProject = await this.projectRepository.findByGithubId(input.githubId, input.userId);

      if (existingProject) {
        this.logger.warn({
          event: 'project.rejected',
          reason: 'duplicate_github_id',
          userId: input.userId,
          githubId: input.githubId,
        });
        throw new ConflictException('This GitHub project is already imported');
      }
    }

    if (input.repoUrl) {
      await this.assertNoRepoUrlConflict(input.userId, input.repoUrl);
    }

    const created = await this.projectRepository.create(input);

    this.logger.info({ event: 'project.created', projectId: created.id, userId: input.userId });

    return created;
  }

  public async update(id: string, userId: string, data: UpdateProjectData): Promise<ProjectRecord> {
    const project = await this.projectRepository.findByIdAndUserId(id, userId);

    if (!project) {
      this.logger.warn({ event: 'project.rejected', reason: 'not_found', userId, projectId: id });
      throw new NotFoundException('Project not found');
    }

    if (data.githubId && data.githubId !== project.githubId) {
      const existingProject = await this.projectRepository.findByGithubId(data.githubId, userId);

      if (existingProject) {
        this.logger.warn({ event: 'project.rejected', reason: 'duplicate_github_id', userId, projectId: id });
        throw new ConflictException('This GitHub project is already imported');
      }
    }

    if (data.repoUrl && data.repoUrl !== project.repoUrl) {
      await this.assertNoRepoUrlConflict(userId, data.repoUrl, id);
    }

    const updatedProject = await this.projectRepository.update(id, userId, data);

    if (!updatedProject) {
      this.logger.warn({ event: 'project.rejected', reason: 'not_found', userId, projectId: id });
      throw new NotFoundException('Project not found');
    }

    await this.invalidatePublicListingCache(id);

    this.logger.info({ event: 'project.updated', projectId: updatedProject.id, userId });

    return updatedProject;
  }

  public async delete(id: string, userId: string): Promise<void> {
    // WHY: WebsiteProject.projectId is onDelete: Cascade, so the join rows are gone the instant the delete succeeds — the linked websiteIds must be captured before, not after.
    const websiteIds = await this.websiteProjectRepository.findWebsiteIdsByProjectId(id);

    const deleted = await this.projectRepository.delete(id, userId);

    if (!deleted) {
      this.logger.warn({ event: 'project.rejected', reason: 'not_found', userId, projectId: id });
      throw new NotFoundException('Project not found');
    }

    await this.invalidateCacheForWebsites(websiteIds);

    this.logger.info({ event: 'project.deleted', projectId: id, userId });
  }

  private async invalidatePublicListingCache(projectId: string): Promise<void> {
    const websiteIds = await this.websiteProjectRepository.findWebsiteIdsByProjectId(projectId);

    await this.invalidateCacheForWebsites(websiteIds);
  }

  // WHY: a project can be linked to multiple websites via WebsiteProject, so every affected website's cached public listing must be evicted, not just one.
  private async invalidateCacheForWebsites(websiteIds: string[]): Promise<void> {
    await Promise.all(
      websiteIds.map(async (websiteId) => {
        await this.cacheService.del(buildWebsiteProjectsCacheKey(websiteId));
      }),
    );
  }

  private async assertNoRepoUrlConflict(userId: string, repoUrl: string, excludeProjectId?: string): Promise<void> {
    const normalizedRepoUrl = normalizeRepoUrl(repoUrl);
    const existingProjects = await this.projectRepository.findRepoUrlsByUserId(userId);

    const hasConflict = existingProjects.some(
      (existingProject) =>
        existingProject.id !== excludeProjectId &&
        existingProject.repoUrl !== null &&
        normalizeRepoUrl(existingProject.repoUrl) === normalizedRepoUrl,
    );

    if (hasConflict) {
      this.logger.warn({
        event: 'project.rejected',
        reason: 'duplicate_repo_url',
        userId,
        projectId: excludeProjectId,
      });
      throw new ConflictException('A project with this repository URL already exists');
    }
  }
}
