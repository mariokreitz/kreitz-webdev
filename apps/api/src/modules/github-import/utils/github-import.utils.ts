import type { CreateProjectData, UpdateProjectData } from '@app/database/types/project.types';
import type { GithubRepoApiResponse } from '@app/modules/github-import/types/github-api.types';

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 50;

export function toCreateProjectData(userId: string, repo: GithubRepoApiResponse): CreateProjectData {
  const liveUrl = toValidHttpUrl(repo.homepage);
  const tags = buildTags(repo.language, repo.topics);

  return {
    userId,
    githubId: String(repo.id),
    githubOwner: repo.owner.login,
    githubRepo: repo.name,
    name: repo.name,

    ...(repo.description !== null && { description: repo.description }),

    repoUrl: repo.html_url,

    ...(liveUrl !== null && { liveUrl }),

    ...(tags.length > 0 && { tags }),

    ...toGithubMetadata(repo),
  };
}

export function toGithubMetadataUpdate(repo: GithubRepoApiResponse): UpdateProjectData {
  return toGithubMetadata(repo);
}

export function buildGithubReposCacheKey(userId: string): string {
  return `user:${userId}:github-repos`;
}

function toGithubMetadata(
  repo: GithubRepoApiResponse,
): Pick<CreateProjectData, 'githubStars' | 'githubCreatedAt' | 'githubUpdatedAt' | 'lastSyncedAt'> {
  return {
    githubStars: repo.stargazers_count,
    githubCreatedAt: new Date(repo.created_at),
    // WHY: pushed_at reflects actual code pushes, updated_at can change from non-code metadata edits; pushed_at is null only for a repo with no commits.
    githubUpdatedAt: new Date(repo.pushed_at ?? repo.updated_at),
    lastSyncedAt: new Date(),
  };
}

function toValidHttpUrl(value: string | null): string | null {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

function buildTags(language: string | null, topics: string[]): string[] {
  const combined = [language, ...topics].filter((tag): tag is string => Boolean(tag));
  const deduped = Array.from(new Set(combined));

  return deduped.slice(0, MAX_TAGS).map((tag) => tag.slice(0, MAX_TAG_LENGTH));
}
