import { isPublicSocialLink, type PublicSocialLink } from '../app/pages/home/public-social-link.model';
import { RENDER_BLOCKING_TIMEOUT_MS, WEBSITE_TOKEN_ENV_VAR } from './config';
import { authenticatedFetch, buildForwardedHeaders, isEnvelopeOf } from './http-client';

export async function fetchPublicSocialLinks(
  apiBaseUrl: string,
  clientIp: string | undefined,
): Promise<readonly PublicSocialLink[]> {
  const result = await authenticatedFetch(`${apiBaseUrl}/public/social-links`, RENDER_BLOCKING_TIMEOUT_MS, {
    headers: buildForwardedHeaders(clientIp),
  });

  if (result.outcome === 'missing-token') {
    console.error(`[frontend] ${WEBSITE_TOKEN_ENV_VAR} is not set, rendering the home page without live social links.`);
    return [];
  }

  if (result.outcome === 'fetch-error') {
    console.error('[frontend] Failed to fetch public social links.', result.error);
    return [];
  }

  const { response } = result;

  if (!response.ok) {
    console.error(`[frontend] Public social links request failed with status ${response.status}.`);
    return [];
  }

  const payload: unknown = await response.json();

  if (!isEnvelopeOf(payload, isPublicSocialLink)) {
    console.error('[frontend] Public social links response has an unexpected shape.');
    return [];
  }

  return payload.data;
}
