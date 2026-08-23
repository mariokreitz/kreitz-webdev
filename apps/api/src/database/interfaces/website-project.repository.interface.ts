import type {
  CreateWebsiteProjectData,
  UpdateWebsiteProjectData,
  WebsiteProjectRecord,
  WebsiteProjectWithProjectRecord,
} from '../types/website-project.types';

export interface IWebsiteProjectRepository {
  findById: (id: string) => Promise<WebsiteProjectRecord | null>;

  findByWebsiteAndProject: (websiteId: string, projectId: string) => Promise<WebsiteProjectRecord | null>;

  findManyByWebsiteId: (websiteId: string) => Promise<WebsiteProjectWithProjectRecord[]>;

  create: (data: CreateWebsiteProjectData) => Promise<WebsiteProjectRecord>;

  update: (id: string, websiteId: string, data: UpdateWebsiteProjectData) => Promise<WebsiteProjectRecord | null>;

  delete: (id: string, websiteId: string) => Promise<boolean>;
}
