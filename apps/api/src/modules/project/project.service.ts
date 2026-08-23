import { IProjectRepository } from '@app/database/interfaces/project.repository.interface';
import { CreateProjectData, ProjectRecord, UpdateProjectData } from '@app/database/types/project.types';
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PROJECT_REPOSITORY } from './tokens/project.tokens';

@Injectable()
export class ProjectService {
  constructor(
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
  ) {}

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

    return this.projectRepository.create(input);
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

    const updatedProject = await this.projectRepository.update(id, userId, data);

    if (!updatedProject) {
      throw new NotFoundException('Project not found');
    }

    return updatedProject;
  }

  public async delete(id: string, userId: string): Promise<void> {
    const deleted = await this.projectRepository.delete(id, userId);

    if (!deleted) {
      throw new NotFoundException('Project not found');
    }
  }
}
