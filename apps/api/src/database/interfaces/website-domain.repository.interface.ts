import type { WebsiteDomainRecord } from '@app/database/types/website-domain.types';

export interface IWebsiteDomainRepository {
  findManyByWebsiteId: (websiteId: string) => Promise<WebsiteDomainRecord[]>;

  findByIdAndWebsiteId: (id: string, websiteId: string) => Promise<WebsiteDomainRecord | null>;

  findByDomain: (domain: string) => Promise<WebsiteDomainRecord | null>;

  findVerifiedByDomain: (domain: string) => Promise<WebsiteDomainRecord | null>;

  create: (websiteId: string, domain: string) => Promise<WebsiteDomainRecord>;

  update: (id: string, websiteId: string, domain: string) => Promise<WebsiteDomainRecord | null>;

  delete: (id: string, websiteId: string) => Promise<WebsiteDomainRecord | null>;
}
