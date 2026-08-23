export interface WebsiteTokenRecord {
  id: string;
  websiteId: string;

  name: string;
  prefix: string;
  tokenHash: string;

  active: boolean;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  revokedAt: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebsiteTokenData {
  websiteId: string;
  name: string;
  prefix: string;
  tokenHash: string;
  expiresAt?: Date | null;
}
