export interface WebsiteTokenAuthenticationRecord {
  id: string;
  websiteId: string;

  active: boolean;
  expiresAt: Date | null;
  revokedAt: Date | null;
}
