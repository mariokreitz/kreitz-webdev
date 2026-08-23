import type { CreateWebsiteData, UpdateWebsiteData, WebsiteRecord } from '@app/database/types/website.repository.types';

export interface IWebsiteRepository {
  findById: (id: string) => Promise<WebsiteRecord | null>;

  findByIdAndUserId: (id: string, userId: string) => Promise<WebsiteRecord | null>;

  findBySlug: (slug: string) => Promise<WebsiteRecord | null>;

  findByDomain: (domain: string) => Promise<WebsiteRecord | null>;

  findManyByUserId: (userId: string) => Promise<WebsiteRecord[]>;

  create: (data: CreateWebsiteData) => Promise<WebsiteRecord>;

  update: (id: string, userId: string, data: UpdateWebsiteData) => Promise<WebsiteRecord | null>;

  delete: (id: string, userId: string) => Promise<boolean>;
}
