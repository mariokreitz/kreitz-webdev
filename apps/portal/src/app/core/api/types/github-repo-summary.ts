export interface GithubRepoSummary {
  readonly githubId: string;
  readonly name: string;
  readonly fullName: string;
  readonly htmlUrl: string;
  readonly description: string | null;
  readonly homepage: string | null;
  readonly language: string | null;
  readonly topics: readonly string[];
  readonly private: boolean;
  readonly updatedAt: string;
}
