import type { WebsiteDomainRecord } from '@app/database/types/website-domain.types';

export interface IWebsiteDomainRepository {
  findByIdAndWebsiteId: (id: string, websiteId: string) => Promise<WebsiteDomainRecord | null>;

  findManyByWebsiteId: (websiteId: string) => Promise<WebsiteDomainRecord[]>;
}
