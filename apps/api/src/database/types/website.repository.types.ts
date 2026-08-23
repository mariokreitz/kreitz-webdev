export interface WebsiteRecord {
  id: string;
  userId: string;
  name: string;
  slug: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebsiteData {
  userId: string;
  name: string;
  slug: string;
  domain: string;
}

export interface UpdateWebsiteData {
  name?: string;
  slug?: string;
  enabled?: boolean;
}
