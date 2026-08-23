export interface GithubLinkedAccount {
  id: string;
  // Stored so importRepo can verify a fetched repo's owner without an extra GitHub API call.
  accountId: string;
}
