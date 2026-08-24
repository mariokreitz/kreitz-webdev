export interface CreateProjectPayload {
  readonly name: string;
  readonly description?: string;
  readonly repoUrl?: string;
  readonly liveUrl?: string;
  readonly tags?: readonly string[];
  readonly imageUrl?: string;
}

export interface UpdateProjectPayload {
  readonly name?: string;
  readonly description?: string;
  readonly repoUrl?: string;
  readonly liveUrl?: string;
  readonly tags?: readonly string[];
  readonly imageUrl?: string;
}
