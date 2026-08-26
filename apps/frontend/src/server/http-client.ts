import { WEBSITE_TOKEN_ENV_VAR } from './config';

export interface AuthenticatedRequestInit {
  readonly method?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly body?: string;
}

export type AuthenticatedFetchResult =
  | { readonly outcome: 'missing-token' }
  | { readonly outcome: 'fetch-error'; readonly error: unknown }
  | { readonly outcome: 'response'; readonly response: Response };

export async function authenticatedFetch(
  url: string,
  timeoutMs: number,
  init?: AuthenticatedRequestInit,
): Promise<AuthenticatedFetchResult> {
  const token = process.env[WEBSITE_TOKEN_ENV_VAR];

  if (!token) {
    return { outcome: 'missing-token' };
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers: { ...init?.headers, Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(timeoutMs),
    });

    return { outcome: 'response', response };
  } catch (error) {
    return { outcome: 'fetch-error', error };
  }
}

export function isEnvelopeOf<T>(
  value: unknown,
  isItem: (item: unknown) => item is T,
): value is { readonly data: readonly T[] } {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const { data } = value as Record<string, unknown>;

  return Array.isArray(data) && data.every(isItem);
}
