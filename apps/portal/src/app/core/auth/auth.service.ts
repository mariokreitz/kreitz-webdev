import { inject, Injectable } from '@angular/core';
import { EMAIL_NOT_VERIFIED_CODE, LOGIN_ROUTE } from './constants';
import { AUTH_CLIENT } from './tokens/auth-client.token';
import type { AuthClient, AuthResult, SocialAuthResult } from './types/auth.types';

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
  }

  public async loginWithGithub(callbackURL: string, errorCallbackURL: string): Promise<SocialAuthResult> {
    const { error } = await this.authClient.signIn.social({
      provider: 'github',
      callbackURL: this.toAbsoluteUrl(callbackURL),
      errorCallbackURL: this.toAbsoluteUrl(errorCallbackURL),
    });

    if (error) {
      return { ok: false, message: error.message ?? 'GitHub sign-in failed.' };
    }

    return { ok: true };
  }

  public async hasActiveSession(): Promise<boolean> {
    const { data } = await this.authClient.getSession();
    return data !== null;
  }

  public async logout(): Promise<void> {
    await this.authClient.signOut();
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
