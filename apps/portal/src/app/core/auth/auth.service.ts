import { inject, Injectable } from '@angular/core';
import { EMAIL_NOT_VERIFIED_CODE } from './constants';
import { AUTH_CLIENT } from './tokens/auth-client.token';
import type { AuthClient, AuthResult } from './types/auth.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authClient: AuthClient = inject(AUTH_CLIENT);

  public async login(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.authClient.signIn.email({ email, password });

    if (error) {
      return this.toFailure(error.code, error.message ?? 'Login failed.');
    }

    return { ok: true, email: data.user.email };
  }

  public async register(email: string, password: string, name: string): Promise<AuthResult> {
    const { data, error } = await this.authClient.signUp.email({ email, password, name });

    if (error) {
      return this.toFailure(error.code, error.message ?? 'Registration failed.');
    }

    return { ok: true, email: data.user.email };
  }

  public isEmailNotVerifiedError(code: string | undefined): boolean {
    return code === EMAIL_NOT_VERIFIED_CODE;
  }

  private toFailure(code: string | undefined, message: string): AuthResult {
    return code === undefined ? { ok: false, message } : { ok: false, code, message };
  }
}
