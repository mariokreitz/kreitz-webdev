import type { PublicProjectRecord } from '@app/database/types/public-project.types';

export interface IPublicProjectRepository {
  findPublishedByWebsiteId: (websiteId: string) => Promise<PublicProjectRecord[]>;
}
