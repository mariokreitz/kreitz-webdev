export interface PublicProjectRecord {
  id: string;
  name: string;
  description: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
  tags: string[];
  imageUrl: string | null;
}
