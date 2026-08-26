import type { PublicCompanyRecord } from '@app/database/types/public-company.types';

export interface IPublicCompanyRepository {
  findManyByWebsiteId: (websiteId: string) => Promise<PublicCompanyRecord[]>;
}
