export interface PublicProjectRecord {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  imageUrl: string | null;

  githubOwner: string | null;
  githubRepo: string | null;

  sortOrder: number;
}
