import type { WebsiteDomainSummaryRecord } from '@app/database/types/website-domain-summary.types';

export interface IWebsiteDomainSummaryRepository {
  countForUser: (userId: string) => Promise<WebsiteDomainSummaryRecord>;
}
