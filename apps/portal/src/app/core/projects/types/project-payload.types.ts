import type { ProjectCategory } from '../../api';

export interface CreateProjectPayload {
  readonly name: string;
  readonly description?: string;
  readonly repoUrl?: string;
  readonly liveUrl?: string;
  readonly tags?: readonly string[];
  readonly imageUrl?: string;
  readonly category?: ProjectCategory;
}

export interface UpdateProjectPayload {
  readonly name?: string;
  readonly description?: string;
  readonly repoUrl?: string;
  readonly liveUrl?: string;
  readonly tags?: readonly string[];
  readonly imageUrl?: string;
  readonly category?: ProjectCategory;
}
