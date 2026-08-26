export interface CvFileResult {
  readonly ok: boolean;
  readonly status: number;
  readonly contentType?: string;
  readonly contentDisposition?: string;
  readonly body?: Buffer;
}

const WEBSITE_TOKEN_ENV_VAR = 'KREITZ_WEBDEV_WEBSITE_TOKEN';
const REQUEST_TIMEOUT_MS = 10_000;

export async function fetchCvFile(apiBaseUrl: string): Promise<CvFileResult> {
  const token = process.env[WEBSITE_TOKEN_ENV_VAR];

  if (!token) {
    console.error(`[frontend] ${WEBSITE_TOKEN_ENV_VAR} is not set, cannot proxy the CV download.`);
    return { ok: false, status: 404 };
  }

  try {
    const response = await fetch(`${apiBaseUrl}/public/cv`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { ok: false, status: response.status };
    }

    const body = Buffer.from(await response.arrayBuffer());
    const contentDisposition = response.headers.get('content-disposition');

    return {
      ok: true,
      status: response.status,
      contentType: response.headers.get('content-type') ?? 'application/pdf',
      body,
      ...(contentDisposition ? { contentDisposition } : {}),
    };
  } catch (error) {
    console.error('[frontend] Failed to proxy the CV download.', error);
    return { ok: false, status: 502 };
  }
}
