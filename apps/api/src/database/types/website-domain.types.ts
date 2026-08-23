export interface WebsiteDomainRecord {
  id: string;
  websiteId: string;
  domain: string;
  verified: boolean;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
