export interface GithubLinkedAccount {
  id: string;
  // Better Auth's provider-issued account id — for GitHub this is the numeric GitHub user id
  // (stringified), used to verify a repo's owner matches the linked account without an extra API call.
  accountId: string;
}
