import { IProjectRepository } from '@app/database/interfaces/project.repository.interface';
import { CreateProjectData, ProjectRecord, UpdateProjectData } from '@app/database/types/project.types';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PROJECT_REPOSITORY } from './tokens/project.tokens';
import { normalizeRepoUrl } from './utils/normalize-repo-url';

@Injectable()
export class ProjectService {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,

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
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  public async create(input: CreateProjectData): Promise<ProjectRecord> {
    if (input.githubId) {
      const existingProject = await this.projectRepository.findByGithubId(input.githubId, input.userId);

      if (existingProject) {
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
      throw new NotFoundException('Project not found');
    }

    if (data.githubId && data.githubId !== project.githubId) {
      const existingProject = await this.projectRepository.findByGithubId(data.githubId, userId);

      if (existingProject) {
        throw new ConflictException('This GitHub project is already imported');
      }
    }

    if (data.repoUrl && data.repoUrl !== project.repoUrl) {
      await this.assertNoRepoUrlConflict(userId, data.repoUrl, id);
    }

    const updatedProject = await this.projectRepository.update(id, userId, data);

    if (!updatedProject) {
      throw new NotFoundException('Project not found');
    }

    this.logger.info({ event: 'project.updated', projectId: updatedProject.id, userId });

    return updatedProject;
  }

  public async delete(id: string, userId: string): Promise<void> {
    const deleted = await this.projectRepository.delete(id, userId);

    if (!deleted) {
      throw new NotFoundException('Project not found');
    }

    this.logger.info({ event: 'project.deleted', projectId: id, userId });
  }

  private async assertNoRepoUrlConflict(userId: string, repoUrl: string, excludeProjectId?: string): Promise<void> {
    const normalizedRepoUrl = normalizeRepoUrl(repoUrl);
    const existingProjects = await this.projectRepository.findManyByUserId(userId);

    const hasConflict = existingProjects.some(
      (existingProject) =>
        existingProject.id !== excludeProjectId &&
        existingProject.repoUrl !== null &&
        normalizeRepoUrl(existingProject.repoUrl) === normalizedRepoUrl,
    );

    if (hasConflict) {
      throw new ConflictException('A project with this repository URL already exists');
    }
  }
}
