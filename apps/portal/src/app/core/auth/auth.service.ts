import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import {
  EMAIL_NOT_VERIFIED_CODE,
  FORBIDDEN_STATUS,
  LOGIN_ROUTE,
  NETWORK_ERROR_KEY,
  REQUEST_BLOCKED_KEY,
  TOO_MANY_ATTEMPTS_KEY,
  TOO_MANY_REQUESTS_STATUS,
} from './constants';
import { AUTH_CLIENT } from './tokens/auth-client.token';
import type { AuthClient, AuthResult, ProfileUpdateResult, SessionData, SocialAuthResult } from './types/auth.types';

interface AuthClientError {
  readonly code?: string | undefined;
  readonly message?: string | undefined;
  readonly status: number;
}

function isFetchStatusError(error: unknown): error is { readonly status: number } {
  return error instanceof Error && 'status' in error && typeof (error as { status: unknown }).status === 'number';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly authClient: AuthClient | null = this.isBrowser ? inject(AUTH_CLIENT) : null;
  private readonly translate: TranslateService = inject(TranslateService);

  public async login(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.client().signIn.email({ email, password });

      if (error) {
        return this.toFailure(error.code, this.toErrorMessage(error, 'auth.errors.loginFailed'));
      }

      return { ok: true, email: data.user.email };
    } catch (caughtError) {
      return this.toFailure(undefined, this.toCatchMessage(caughtError));
    }
  }

  public async register(email: string, password: string, name: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.client().signUp.email({
        email,
        password,
        name,
        callbackURL: this.toAbsoluteUrl(LOGIN_ROUTE),
      });

      if (error) {
        return this.toFailure(error.code, this.toErrorMessage(error, 'auth.errors.registerFailed'));
      }

      return { ok: true, email: data.user.email };
    } catch (caughtError) {
      return this.toFailure(undefined, this.toCatchMessage(caughtError));
    }
  }

  public async loginWithGithub(callbackURL: string, errorCallbackURL: string): Promise<SocialAuthResult> {
    try {
      const { error } = await this.client().signIn.social({
        provider: 'github',
        callbackURL: this.toAbsoluteUrl(callbackURL),
        errorCallbackURL: this.toAbsoluteUrl(errorCallbackURL),
      });

      if (error) {
        return { ok: false, message: this.toErrorMessage(error, 'auth.errors.githubFailed') };
      }

      return { ok: true };
    } catch (caughtError) {
      return { ok: false, message: this.toCatchMessage(caughtError) };
    }
  }

  public async updateName(name: string): Promise<ProfileUpdateResult> {
    try {
      const { error } = await this.client().updateUser({ name });

      if (error) {
        return { ok: false, message: this.toErrorMessage(error, 'auth.errors.updateNameFailed') };
      }

      return { ok: true };
    } catch (caughtError) {
      return { ok: false, message: this.toCatchMessage(caughtError) };
    }
  }

  public async getSession(): Promise<SessionData | null> {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const { data } = await this.client().getSession();
      return data ?? null;
    } catch {
      return null;
    }
  }

  public async listLinkedProviders(): Promise<readonly string[]> {
    if (!this.isBrowser) {
      return [];
    }

    try {
      const { data } = await this.client().listAccounts();
      return data?.map((account) => account.providerId) ?? [];
    } catch {
      return [];
    }
  }

  public async logout(): Promise<void> {
    if (!this.isBrowser) {
      return;
    }

    try {
      await this.client().signOut();
    } catch {
      // no-op
    }
  }

  public isEmailNotVerifiedError(code: string | undefined): boolean {
    return code === EMAIL_NOT_VERIFIED_CODE;
  }

  private client(): AuthClient {
    if (this.authClient === null) {
      throw new Error('AuthService methods that call authClient must run in a browser context.');
    }

    return this.authClient;
  }

  private toFailure(code: string | undefined, message: string): AuthResult {
    return code === undefined ? { ok: false, message } : { ok: false, code, message };
  }

  private toErrorMessage(error: AuthClientError, fallbackKey: string): string {
    if (error.code === undefined) {
      const blockedMessage = this.toBlockedMessage(error.status);

      if (blockedMessage !== undefined) {
        return blockedMessage;
      }
    }

    return error.message ?? this.translate.instant(fallbackKey);
  }

  private toCatchMessage(error: unknown): string {
    if (isFetchStatusError(error)) {
      const blockedMessage = this.toBlockedMessage(error.status);

      if (blockedMessage !== undefined) {
        return blockedMessage;
      }
    }

    return this.translate.instant(NETWORK_ERROR_KEY);
  }

  private toBlockedMessage(status: number): string | undefined {
    if (status === TOO_MANY_REQUESTS_STATUS) {
      return this.translate.instant(TOO_MANY_ATTEMPTS_KEY);
    }

    if (status === FORBIDDEN_STATUS) {
      return this.translate.instant(REQUEST_BLOCKED_KEY);
    }

    return undefined;
  }

  private toAbsoluteUrl(path: string): string {
    return new URL(path, window.location.origin).toString();
  }
}
