export interface ProjectRecord {
  id: string;
  userId: string;

  githubId: string | null;
  githubOwner: string | null;
  githubRepo: string | null;

  name: string;
  description: string | null;
  repoUrl: string | null;
  liveUrl: string | null;
  tags: string[];
  imageUrl: string | null;

  importedAt: Date;
  updatedAt: Date;
}

export interface CreateProjectData {
  userId: string;

  githubId?: string;
  githubOwner?: string;
  githubRepo?: string;

  name: string;
  description?: string;
  repoUrl?: string;
  liveUrl?: string;
  tags?: string[];
  imageUrl?: string;
}

export interface UpdateProjectData {
  githubId?: string;
  githubOwner?: string;
  githubRepo?: string;

  name?: string;
  description?: string;
  repoUrl?: string;
  liveUrl?: string;
  tags?: string[];
  imageUrl?: string;
}
