import type { GithubLinkedAccount } from '@app/database/types/github-account.types';

export interface IGithubAccountRepository {
  findByUserId: (userId: string) => Promise<GithubLinkedAccount | null>;
}
