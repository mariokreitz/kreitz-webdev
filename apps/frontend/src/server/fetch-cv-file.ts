import { USER_ACTION_TIMEOUT_MS, WEBSITE_TOKEN_ENV_VAR } from './config';
import { authenticatedFetch } from './http-client';

export interface CvFileResult {
  readonly ok: boolean;
  readonly status: number;
  readonly contentType?: string;
  readonly contentDisposition?: string;
  readonly body?: Buffer;
}

export async function fetchCvFile(apiBaseUrl: string): Promise<CvFileResult> {
  const result = await authenticatedFetch(`${apiBaseUrl}/public/cv`, USER_ACTION_TIMEOUT_MS);

  if (result.outcome === 'missing-token') {
    console.error(`[frontend] ${WEBSITE_TOKEN_ENV_VAR} is not set, cannot proxy the CV download.`);
    return { ok: false, status: 404 };
  }

  if (result.outcome === 'fetch-error') {
    console.error('[frontend] Failed to proxy the CV download.', result.error);
    return { ok: false, status: 502 };
  }

  const { response } = result;

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
}
