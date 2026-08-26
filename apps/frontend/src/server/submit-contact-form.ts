import { USER_ACTION_TIMEOUT_MS, WEBSITE_TOKEN_ENV_VAR } from './config';
import { authenticatedFetch } from './http-client';

export interface ContactFormPayload {
  readonly name: string;
  readonly email: string;
  readonly message: string;
}

export interface SubmitContactFormResult {
  readonly ok: boolean;
  readonly status: number;
}

export async function submitContactForm(
  apiBaseUrl: string,
  payload: ContactFormPayload,
): Promise<SubmitContactFormResult> {
  const result = await authenticatedFetch(`${apiBaseUrl}/public/contact`, USER_ACTION_TIMEOUT_MS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (result.outcome === 'missing-token') {
    console.error(`[frontend] ${WEBSITE_TOKEN_ENV_VAR} is not set, cannot forward contact form submissions.`);
    return { ok: false, status: 503 };
  }

  if (result.outcome === 'fetch-error') {
    console.error('[frontend] Failed to submit contact form.', result.error);
    return { ok: false, status: 502 };
  }

  const { response } = result;

  if (!response.ok) {
    console.error(`[frontend] Contact form submission failed with status ${response.status}.`);
  }

  return { ok: response.ok, status: response.status };
}
