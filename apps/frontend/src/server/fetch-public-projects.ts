import { isPublicProject, type PublicProject } from '../app/pages/home/public-project.model';
import { RENDER_BLOCKING_TIMEOUT_MS, WEBSITE_TOKEN_ENV_VAR } from './config';
import { authenticatedFetch, buildForwardedHeaders, isEnvelopeOf } from './http-client';

export async function fetchPublicProjects(
  apiBaseUrl: string,
  clientIp: string | undefined,
): Promise<readonly PublicProject[]> {
  const result = await authenticatedFetch(`${apiBaseUrl}/public/projects`, RENDER_BLOCKING_TIMEOUT_MS, {
    headers: buildForwardedHeaders(clientIp),
  });

  if (result.outcome === 'missing-token') {
    console.error(`[frontend] ${WEBSITE_TOKEN_ENV_VAR} is not set, rendering the home page without live projects.`);
    return [];
  }

  if (result.outcome === 'fetch-error') {
    console.error('[frontend] Failed to fetch public projects.', result.error);
    return [];
  }

  const { response } = result;

  if (!response.ok) {
    console.error(`[frontend] Public projects request failed with status ${response.status}.`);
    return [];
  }

  const payload: unknown = await response.json();

  if (!isEnvelopeOf(payload, isPublicProject)) {
    console.error('[frontend] Public projects response has an unexpected shape.');
    return [];
  }

  return payload.data;
}
