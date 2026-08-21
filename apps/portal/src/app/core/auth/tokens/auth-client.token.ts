import { isPlatformBrowser } from '@angular/common';
import { inject, InjectionToken, PLATFORM_ID } from '@angular/core';
import { dashClient } from '@better-auth/infra/client';
import { createAuthClient } from 'better-auth/client';
import type { AuthClient } from '../types/auth.types';

const AUTH_BASE_URL = 'http://localhost:3000';

export const AUTH_CLIENT = new InjectionToken<AuthClient>('AUTH_CLIENT', {
  factory: () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) {
      throw new Error('AUTH_CLIENT can only be constructed in a browser context.');
    }

    return createAuthClient({
      baseURL: AUTH_BASE_URL,
      plugins: [dashClient()],
    });
  },
});
