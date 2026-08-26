import { isPublicProject, type PublicProject } from '../app/pages/home/public-project.model';

interface PublicProjectsEnvelope {
  readonly statusCode: number;
  readonly message: string;
  readonly data: readonly PublicProject[];
}

function isPublicProjectsEnvelope(value: unknown): value is Pick<PublicProjectsEnvelope, 'data'> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const { data } = value as Record<string, unknown>;

  return Array.isArray(data) && data.every(isPublicProject);
}

const WEBSITE_TOKEN_ENV_VAR = 'KREITZ_WEBDEV_WEBSITE_TOKEN';
// WHY: this fetch blocks the home page's render, and already degrades to an empty list on failure;
// a short ceiling gets the visitor to that same fallback quickly instead of stalling TTFB for 10s.
const REQUEST_TIMEOUT_MS = 3_000;

export async function fetchPublicProjects(apiBaseUrl: string): Promise<readonly PublicProject[]> {
  const token = process.env[WEBSITE_TOKEN_ENV_VAR];

  if (!token) {
    console.error(`[frontend] ${WEBSITE_TOKEN_ENV_VAR} is not set, rendering the home page without live projects.`);
    return [];
  }

  try {
    const response = await fetch(`${apiBaseUrl}/public/projects`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(`[frontend] Public projects request failed with status ${response.status}.`);
      return [];
    }

    const payload: unknown = await response.json();

    if (!isPublicProjectsEnvelope(payload)) {
      console.error('[frontend] Public projects response has an unexpected shape.');
      return [];
    }

    return payload.data;
  } catch (error) {
    console.error('[frontend] Failed to fetch public projects.', error);
    return [];
  }
}
