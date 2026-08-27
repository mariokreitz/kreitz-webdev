export interface PublicSocialLinkRecord {
  id: string;
  platform: string;
  label: string | null;
  url: string;
  sortOrder: number;
}
