import type { CreateWebsiteTokenData, WebsiteTokenRecord } from '@app/database/types/website-token.types';

export interface IWebsiteTokenRepository {
  findById: (id: string) => Promise<WebsiteTokenRecord | null>;

  findByIdAndWebsiteId: (id: string, websiteId: string) => Promise<WebsiteTokenRecord | null>;

  findByTokenHash: (tokenHash: string) => Promise<WebsiteTokenRecord | null>;

  findManyByWebsiteId: (websiteId: string) => Promise<WebsiteTokenRecord[]>;

  create: (data: CreateWebsiteTokenData) => Promise<WebsiteTokenRecord>;

  delete: (id: string, websiteId: string) => Promise<boolean>;

  updateLastUsedAt: (id: string, lastUsedAt: Date) => Promise<void>;
}
