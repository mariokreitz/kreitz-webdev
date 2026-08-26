import { RENDER_BLOCKING_TIMEOUT_MS, WEBSITE_TOKEN_ENV_VAR } from './config';
import { authenticatedFetch } from './http-client';

export async function fetchCvAvailable(apiBaseUrl: string): Promise<boolean> {
  const result = await authenticatedFetch(`${apiBaseUrl}/public/cv`, RENDER_BLOCKING_TIMEOUT_MS, {
    method: 'HEAD',
  });

  if (result.outcome === 'missing-token') {
    console.error(
      `[frontend] ${WEBSITE_TOKEN_ENV_VAR} is not set, rendering the home page without a CV download link.`,
    );
    return false;
  }

  if (result.outcome === 'fetch-error') {
    console.error('[frontend] Failed to check CV availability.', result.error);
    return false;
  }

  return result.response.ok;
}
