export interface ProjectRecord {
  id: string;
  userId: string;

  githubId: string | null;
  githubOwner: string | null;
  githubRepo: string | null;

  name: string;
  description: string | null;
  url: string | null;
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
  url?: string;
  imageUrl?: string;
}

export interface UpdateProjectData {
  githubId?: string;
  githubOwner?: string;
  githubRepo?: string;

  name?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
}
