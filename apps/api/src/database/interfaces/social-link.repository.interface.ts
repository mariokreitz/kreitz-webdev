import type {
  CreateSocialLinkData,
  SocialLinkRecord,
  UpdateSocialLinkData,
} from '@app/database/types/social-link.types';

export interface ISocialLinkRepository {
  findManyByWebsiteId: (websiteId: string) => Promise<SocialLinkRecord[]>;

  findByIdAndWebsiteId: (id: string, websiteId: string) => Promise<SocialLinkRecord | null>;

  create: (data: CreateSocialLinkData) => Promise<SocialLinkRecord>;

  update: (id: string, websiteId: string, data: UpdateSocialLinkData) => Promise<SocialLinkRecord | null>;

  delete: (id: string, websiteId: string) => Promise<boolean>;
}
