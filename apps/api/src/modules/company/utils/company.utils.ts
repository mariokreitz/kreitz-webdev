export function buildWebsiteCompaniesCacheKey(websiteId: string): string {
  return `website:${websiteId}:companies`;
}
