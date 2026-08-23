import type { CreateWebsiteTokenData, WebsiteTokenRecord } from '@app/database/types/website-token.types';

export interface IWebsiteTokenRepository {
  findByTokenHash: (tokenHash: string) => Promise<WebsiteTokenRecord | null>;

  findManyByWebsiteId: (websiteId: string) => Promise<WebsiteTokenRecord[]>;

  findByIdAndWebsiteId: (id: string, websiteId: string) => Promise<WebsiteTokenRecord | null>;

  create: (data: CreateWebsiteTokenData) => Promise<WebsiteTokenRecord>;

  delete: (id: string, websiteId: string) => Promise<WebsiteTokenRecord | null>;

  updateLastUsedAt: (id: string, lastUsedAt: Date) => Promise<void>;
}
