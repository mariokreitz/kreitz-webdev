export type ProjectCategory = 'DEMO' | 'OPEN_SOURCE' | 'POC' | 'MVP' | 'PLATFORM';

export interface Project {
  readonly id: string;
  readonly userId: string;
  readonly githubId: string | null;
  readonly githubOwner: string | null;
  readonly githubRepo: string | null;
  readonly name: string;
  readonly description: string | null;
  readonly repoUrl: string | null;
  readonly liveUrl: string | null;
  readonly tags: readonly string[];
  readonly imageUrl: string | null;
  readonly category: ProjectCategory | null;
  readonly githubStars: number | null;
  readonly githubCreatedAt: string | null;
  readonly githubUpdatedAt: string | null;
  readonly lastSyncedAt: string | null;
  readonly importedAt: string;
  readonly updatedAt: string;
}
