export interface SocialLink {
  readonly id: string;
  readonly websiteId: string;
  readonly platform: string;
  readonly label: string | null;
  readonly url: string;
  readonly sortOrder: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}
