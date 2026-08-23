import type { ProjectRecord } from '../types/project.types';

export interface WebsiteProjectRecord {
  id: string;
  websiteId: string;
  projectId: string;

  published: boolean;
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface WebsiteProjectWithProjectRecord extends WebsiteProjectRecord {
  project: ProjectRecord;
}

export interface CreateWebsiteProjectData {
  websiteId: string;
  projectId: string;

  published?: boolean;
  sortOrder?: number;
}

export interface UpdateWebsiteProjectData {
  published?: boolean;
  sortOrder?: number;
}
