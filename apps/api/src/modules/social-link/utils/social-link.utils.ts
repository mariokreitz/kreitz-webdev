export function buildWebsiteSocialLinksCacheKey(websiteId: string): string {
  return `website:${websiteId}:social-links`;
}
