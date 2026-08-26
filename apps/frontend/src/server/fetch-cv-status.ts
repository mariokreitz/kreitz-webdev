const WEBSITE_TOKEN_ENV_VAR = 'KREITZ_WEBDEV_WEBSITE_TOKEN';
// WHY: this fetch blocks the home page's render (unlike the CV file download itself, which is a
// user-initiated request); a short ceiling lets the render fall back to `false` quickly rather than
// stalling TTFB for the full 10s a backend-down scenario would otherwise cost.
const REQUEST_TIMEOUT_MS = 3_000;

export async function fetchCvAvailable(apiBaseUrl: string): Promise<boolean> {
  const token = process.env[WEBSITE_TOKEN_ENV_VAR];

  if (!token) {
    console.error(
      `[frontend] ${WEBSITE_TOKEN_ENV_VAR} is not set, rendering the home page without a CV download link.`,
    );
    return false;
  }

  try {
    const response = await fetch(`${apiBaseUrl}/public/cv`, {
      method: 'HEAD',
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    return response.ok;
  } catch (error) {
    console.error('[frontend] Failed to check CV availability.', error);
    return false;
  }
}
