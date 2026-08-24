export interface WebsiteTokenSummary {
  readonly id: string;
  readonly websiteId: string;
  readonly name: string;
  readonly prefix: string;
  readonly expiresAt: string | null;
  readonly lastUsedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CreatedWebsiteToken {
  readonly id: string;
  readonly name: string;
  readonly prefix: string;
  readonly token: string;
  readonly expiresAt: string | null;
  readonly createdAt: string;
}
