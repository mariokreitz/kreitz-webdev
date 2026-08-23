export interface CreatedWebsiteTokenResponse {
  id: string;
  name: string;
  prefix: string;
  token: string;
  expiresAt: Date | null;
  createdAt: Date;
}
