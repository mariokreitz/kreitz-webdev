import { inject, Injectable } from '@angular/core';
import { EMAIL_NOT_VERIFIED_CODE, LOGIN_ROUTE, NETWORK_ERROR_MESSAGE } from './constants';
import { AUTH_CLIENT } from './tokens/auth-client.token';
import type { AuthClient, AuthResult, SessionData, SocialAuthResult } from './types/auth.types';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authClient: AuthClient = inject(AUTH_CLIENT);

  public async login(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.authClient.signIn.email({ email, password });

      if (error) {
        return this.toFailure(error.code, error.message ?? 'Login failed.');
      }

      return { ok: true, email: data.user.email };
    } catch {
      return this.toFailure(undefined, NETWORK_ERROR_MESSAGE);
    }
  }

  public async register(email: string, password: string, name: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.authClient.signUp.email({
        email,
        password,
        name,
        callbackURL: this.toAbsoluteUrl(LOGIN_ROUTE),
      });

      if (error) {
        return this.toFailure(error.code, error.message ?? 'Registration failed.');
      }

      return { ok: true, email: data.user.email };
    } catch {
      return this.toFailure(undefined, NETWORK_ERROR_MESSAGE);
    }
  }

  public async loginWithGithub(callbackURL: string, errorCallbackURL: string): Promise<SocialAuthResult> {
    try {
      const { error } = await this.authClient.signIn.social({
        provider: 'github',
        callbackURL: this.toAbsoluteUrl(callbackURL),
        errorCallbackURL: this.toAbsoluteUrl(errorCallbackURL),
      });

      if (error) {
        return { ok: false, message: error.message ?? 'GitHub sign-in failed.' };
      }

      return { ok: true };
    } catch {
      return { ok: false, message: NETWORK_ERROR_MESSAGE };
    }
  }

  public async getSession(): Promise<SessionData | null> {
    try {
      const { data } = await this.authClient.getSession();
      return data ?? null;
    } catch {
      return null;
    }
  }

  public async logout(): Promise<void> {
    try {
      await this.authClient.signOut();
    } catch {
      // Caller's finally block already clears session state, so this only prevents an unhandled rejection.
    }
  }

  public isEmailNotVerifiedError(code: string | undefined): boolean {
    return code === EMAIL_NOT_VERIFIED_CODE;
  }

  private toFailure(code: string | undefined, message: string): AuthResult {
    return code === undefined ? { ok: false, message } : { ok: false, code, message };
  }

  private toAbsoluteUrl(path: string): string {
    return new URL(path, window.location.origin).toString();
  }
}
