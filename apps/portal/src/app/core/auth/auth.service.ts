import { Injectable, inject } from '@angular/core';
import { AUTH_CLIENT } from './auth-client.token';
import type { AuthResult } from './types/auth.types';

// authClient.$ERROR_CODES resolves to an unpopulated Proxy at runtime on a plugin-less client (verified empirically
// against the installed better-auth version) even though it is typed as a real object — compare the wire code directly.
const EMAIL_NOT_VERIFIED_CODE = 'EMAIL_NOT_VERIFIED';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authClient = inject(AUTH_CLIENT);

  async login(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.authClient.signIn.email({ email, password });

    if (error) {
      return this.toFailure(error.code, error.message ?? 'Login failed.');
    }

    return { ok: true, email: data.user.email };
  }

  async register(email: string, password: string, name: string): Promise<AuthResult> {
    const { data, error } = await this.authClient.signUp.email({ email, password, name });

    if (error) {
      return this.toFailure(error.code, error.message ?? 'Registration failed.');
    }

    return { ok: true, email: data.user.email };
  }

  isEmailNotVerifiedError(code: string | undefined): boolean {
    return code === EMAIL_NOT_VERIFIED_CODE;
  }

  private toFailure(code: string | undefined, message: string): AuthResult {
    return code === undefined ? { ok: false, message } : { ok: false, code, message };
  }
}
