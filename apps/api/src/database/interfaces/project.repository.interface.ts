import type { CreateProjectData, ProjectRecord, UpdateProjectData } from '@app/database/types/project.types';

export interface IProjectRepository {
  findManyByUserId: (userId: string) => Promise<ProjectRecord[]>;

  findById: (id: string) => Promise<ProjectRecord | null>;

  findByIdAndUserId: (id: string, userId: string) => Promise<ProjectRecord | null>;

  findByGithubId: (githubId: string, userId: string) => Promise<ProjectRecord | null>;

  create: (data: CreateProjectData) => Promise<ProjectRecord>;

  update: (id: string, userId: string, data: UpdateProjectData) => Promise<ProjectRecord | null>;

  delete: (id: string, userId: string) => Promise<boolean>;
}
