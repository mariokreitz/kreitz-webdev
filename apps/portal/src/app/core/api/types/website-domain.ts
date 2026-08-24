export interface WebsiteDomain {
  readonly id: string;
  readonly websiteId: string;
  readonly domain: string;
  readonly verified: boolean;
  readonly verifiedAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}
