export function normalizeRepoUrl(repoUrl: string): string {
  return repoUrl
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '');
}
