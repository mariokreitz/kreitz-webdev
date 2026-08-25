import type { ProjectCategory } from '../../../generated/prisma/enums';

export interface PublicProjectRecord {
  id: string;
  name: string;
  description: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
  tags: string[];
  imageUrl: string | null;
  category: ProjectCategory | null;
  githubStars: number | null;
  githubCreatedAt: Date | null;
  githubUpdatedAt: Date | null;
}
