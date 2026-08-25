export interface WebsiteDomainRecord {
  id: string;
  websiteId: string;
  domain: string;
  verified: boolean;
  verifiedAt: Date | null;
  verificationToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebsiteDomainData {
  websiteId: string;
  domain: string;
  verificationToken: string;
}

export interface UpdateWebsiteDomainData {
  domain: string;
}
