import type { Project } from './project';

export interface WebsiteProjectLink {
  readonly id: string;
  readonly websiteId: string;
  readonly projectId: string;
  readonly published: boolean;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WebsiteProjectLinkWithProject extends WebsiteProjectLink {
  readonly project: Project;
}
