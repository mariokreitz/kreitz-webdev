export interface WebsiteRecord {
  id: string;
  userId: string;
  name: string;
  slug: string;
  enabled: boolean;
  contactEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebsiteData {
  userId: string;
  name: string;
  slug: string;
  domain: string;
  verificationToken: string;
}

export interface UpdateWebsiteData {
  name?: string;
  slug?: string;
  enabled?: boolean;
  contactEmail?: string | null;
}
