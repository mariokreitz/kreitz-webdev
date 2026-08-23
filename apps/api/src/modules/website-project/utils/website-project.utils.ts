export function buildWebsiteProjectsCacheKey(websiteId: string): string {
  return `website:${websiteId}:projects`;
}
