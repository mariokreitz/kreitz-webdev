import { isPlatformBrowser } from '@angular/common';
import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';
import { dashClient } from '@better-auth/infra/client';
import { environment } from '@shared/environments';
import { createAuthClient } from 'better-auth/client';
import { inferAdditionalFields } from 'better-auth/client/plugins';

const AUTH_BASE_URL = environment.api.authBaseUrl;

function createAuthClientOptions() {
  return {
    baseURL: AUTH_BASE_URL,
    plugins: [
      dashClient(),
      inferAdditionalFields({
        user: {
          previousLoginAt: { type: 'date', required: false, input: false },
        },
      }),
    ],
  };
}

export type AuthClient = ReturnType<typeof createAuthClient<ReturnType<typeof createAuthClientOptions>>>;

export const AUTH_CLIENT = new InjectionToken<AuthClient>('AUTH_CLIENT', {
  factory: () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      throw new Error('AUTH_CLIENT can only be constructed in a browser context.');
    }

    return createAuthClient(createAuthClientOptions());
  },
});
