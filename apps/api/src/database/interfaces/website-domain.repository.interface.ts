import type {
  CreateWebsiteDomainData,
  UpdateWebsiteDomainData,
  WebsiteDomainRecord,
} from '@app/database/types/website-domain.types';

export interface IWebsiteDomainRepository {
  findById: (id: string) => Promise<WebsiteDomainRecord | null>;

  findByIdAndWebsiteId: (id: string, websiteId: string) => Promise<WebsiteDomainRecord | null>;

  findByDomain: (domain: string) => Promise<WebsiteDomainRecord | null>;

  findManyByWebsiteId: (websiteId: string) => Promise<WebsiteDomainRecord[]>;

  create: (data: CreateWebsiteDomainData) => Promise<WebsiteDomainRecord>;

  update: (id: string, websiteId: string, data: UpdateWebsiteDomainData) => Promise<WebsiteDomainRecord | null>;

  delete: (id: string, websiteId: string) => Promise<boolean>;
}
