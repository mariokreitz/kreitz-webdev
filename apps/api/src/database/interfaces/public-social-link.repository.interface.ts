import type { PublicSocialLinkRecord } from '@app/database/types/public-social-link.types';

export interface IPublicSocialLinkRepository {
  findManyByWebsiteId: (websiteId: string) => Promise<PublicSocialLinkRecord[]>;
}
