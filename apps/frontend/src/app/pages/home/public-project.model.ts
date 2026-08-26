import { isPublicCompany, type PublicCompany } from './public-company.model';

export type ProjectCategory = 'DEMO' | 'OPEN_SOURCE' | 'POC' | 'MVP' | 'PLATFORM';

export interface PublicProject {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly repoUrl: string | null;
  readonly liveUrl: string | null;
  readonly tags: readonly string[];
  readonly imageUrl: string | null;
  readonly category?: ProjectCategory | null;
  readonly githubStars?: number | null;
  readonly githubCreatedAt?: string | null;
  readonly githubUpdatedAt?: string | null;
}

export interface HomeRequestContext {
  readonly projects: readonly PublicProject[];
  readonly companies: readonly PublicCompany[];
  readonly cvAvailable: boolean;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

const PROJECT_CATEGORIES: readonly ProjectCategory[] = ['DEMO', 'OPEN_SOURCE', 'POC', 'MVP', 'PLATFORM'];

function isNullableProjectCategory(value: unknown): value is ProjectCategory | null | undefined {
  return value === undefined || value === null || PROJECT_CATEGORIES.includes(value as ProjectCategory);
}

function isNullableNumber(value: unknown): value is number | null | undefined {
  return value === undefined || value === null || typeof value === 'number';
}

function isNullableOptionalString(value: unknown): value is string | null | undefined {
  return value === undefined || isNullableString(value);
}

// WHY: category/githubStars/githubCreatedAt/githubUpdatedAt are optional/nullable on the wire — an api response
// that predates these fields, or a project never GitHub-imported, must still pass this guard so the home page
// doesn't silently render zero projects.
export function isPublicProject(value: unknown): value is PublicProject {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const {
    id,
    name,
    description,
    repoUrl,
    liveUrl,
    imageUrl,
    tags,
    category,
    githubStars,
    githubCreatedAt,
    githubUpdatedAt,
  } = value as Record<string, unknown>;

  return (
    typeof id === 'string' &&
    typeof name === 'string' &&
    isNullableString(description) &&
    isNullableString(repoUrl) &&
    isNullableString(liveUrl) &&
    isNullableString(imageUrl) &&
    Array.isArray(tags) &&
    tags.every((tag): tag is string => typeof tag === 'string') &&
    isNullableProjectCategory(category) &&
    isNullableNumber(githubStars) &&
    isNullableOptionalString(githubCreatedAt) &&
    isNullableOptionalString(githubUpdatedAt)
  );
}

export function asHomeRequestContext(value: unknown): HomeRequestContext | null {
  if (value === null || typeof value !== 'object') {
    return null;
  }

  const { projects, companies, cvAvailable } = value as Record<string, unknown>;

  if (
    Array.isArray(projects) &&
    projects.every(isPublicProject) &&
    Array.isArray(companies) &&
    companies.every(isPublicCompany) &&
    typeof cvAvailable === 'boolean'
  ) {
    return { projects, companies, cvAvailable };
  }

  return null;
}
