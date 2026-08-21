import { InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createAuthClient } from 'better-auth/client';

const AUTH_BASE_URL = 'http://localhost:3000';

export type AuthClient = ReturnType<typeof createAuthClient>;

export const AUTH_CLIENT = new InjectionToken<AuthClient>('AUTH_CLIENT', {
  factory: () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      throw new Error('AUTH_CLIENT can only be constructed in a browser context.');
    }

    return createAuthClient({ baseURL: AUTH_BASE_URL });
  },
});
