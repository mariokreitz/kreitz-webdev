export interface ContactFormPayload {
  readonly name: string;
  readonly email: string;
  readonly message: string;
}

export interface SubmitContactFormResult {
  readonly ok: boolean;
  readonly status: number;
}

const WEBSITE_TOKEN_ENV_VAR = 'KREITZ_WEBDEV_WEBSITE_TOKEN';
const REQUEST_TIMEOUT_MS = 10_000;

export async function submitContactForm(
  apiBaseUrl: string,
  payload: ContactFormPayload,
): Promise<SubmitContactFormResult> {
  const token = process.env[WEBSITE_TOKEN_ENV_VAR];

  if (!token) {
    console.error(`[frontend] ${WEBSITE_TOKEN_ENV_VAR} is not set, cannot forward contact form submissions.`);
    return { ok: false, status: 503 };
  }

  try {
    const response = await fetch(`${apiBaseUrl}/public/contact`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(`[frontend] Contact form submission failed with status ${response.status}.`);
    }

    return { ok: response.ok, status: response.status };
  } catch (error) {
    console.error('[frontend] Failed to submit contact form.', error);
    return { ok: false, status: 502 };
  }
}
