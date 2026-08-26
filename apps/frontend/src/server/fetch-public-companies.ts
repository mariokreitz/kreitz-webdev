import { isPublicCompany, type PublicCompany } from '../app/pages/home/public-company.model';
import { RENDER_BLOCKING_TIMEOUT_MS, WEBSITE_TOKEN_ENV_VAR } from './config';
import { authenticatedFetch, isEnvelopeOf } from './http-client';

export async function fetchPublicCompanies(apiBaseUrl: string): Promise<readonly PublicCompany[]> {
  const result = await authenticatedFetch(`${apiBaseUrl}/public/companies`, RENDER_BLOCKING_TIMEOUT_MS);

  if (result.outcome === 'missing-token') {
    console.error(`[frontend] ${WEBSITE_TOKEN_ENV_VAR} is not set, rendering the home page without live companies.`);
    return [];
  }

  if (result.outcome === 'fetch-error') {
    console.error('[frontend] Failed to fetch public companies.', result.error);
    return [];
  }

  const { response } = result;

  if (!response.ok) {
    console.error(`[frontend] Public companies request failed with status ${response.status}.`);
    return [];
  }

  const payload: unknown = await response.json();

  if (!isEnvelopeOf(payload, isPublicCompany)) {
    console.error('[frontend] Public companies response has an unexpected shape.');
    return [];
  }

  return payload.data;
}
