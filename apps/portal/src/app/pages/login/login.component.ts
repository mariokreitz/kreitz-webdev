import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Card } from '@shared/ui';
import { AuthService, DASHBOARD_ROUTE, LOGIN_ROUTE } from '../../core/auth';
import { AuthForm } from './auth-form/auth-form.component';
import type { LoginPayload, RegisterPayload } from './auth-form/types/auth-form.types';

@Component({
  selector: 'kwd-portal-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AuthForm, Card],
  templateUrl: './login.component.html',
})
export default class Login {
  public readonly mode = signal<'login' | 'register'>('login');
  public readonly loading = signal(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly infoMessage = signal<string | null>(null);
  private readonly authService: AuthService = inject(AuthService);
  private readonly router: Router = inject(Router);
  private readonly title: Title = inject(Title);

  constructor() {
    effect(() => {
      this.title.setTitle(this.mode() === 'register' ? 'Create account — Kreitz-WebDev' : 'Sign in — Kreitz-WebDev');
    });
  }

  public async onLogin({ email, password }: LoginPayload): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    const result = await this.authService.login(email, password);

    if (!result.ok) {
      this.loading.set(false);

      if (this.authService.isEmailNotVerifiedError(result.code)) {
        this.infoMessage.set('Please verify your email before signing in — check your inbox.');
        return;
      }

      this.errorMessage.set(result.message);
      return;
    }

    await this.router.navigateByUrl(DASHBOARD_ROUTE);
  }

  public async onRegister({ email, password, name }: RegisterPayload): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    const result = await this.authService.register(email, password, name);

    this.loading.set(false);

    if (!result.ok) {
      this.errorMessage.set(result.message);
      return;
    }

    this.mode.set('login');
    this.infoMessage.set(`Check your email at ${result.email} to verify your account, then sign in.`);
  }

  public async onGithubLogin(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    const result = await this.authService.loginWithGithub(DASHBOARD_ROUTE, LOGIN_ROUTE);

    if (!result.ok) {
      this.loading.set(false);
      this.errorMessage.set(result.message);
    }
  }

  public onToggleMode(): void {
    this.mode.update((mode) => (mode === 'login' ? 'register' : 'login'));
    this.errorMessage.set(null);
    this.infoMessage.set(null);
  }
}
