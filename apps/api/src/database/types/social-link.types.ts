export interface SocialLinkRecord {
  id: string;
  websiteId: string;

  platform: string;
  label: string | null;
  url: string;
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSocialLinkData {
  websiteId: string;
  platform: string;
  url: string;

  label?: string;
  sortOrder?: number;
}

export interface UpdateSocialLinkData {
  platform?: string;
  label?: string;
  url?: string;
  sortOrder?: number;
}
