import { ChangeDetectionStrategy, Component, inject, type OnDestroy, type OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { AuthService, DASHBOARD_ROUTE, LOGIN_ROUTE } from '../../core/auth';
import { AuthForm } from './auth-form/auth-form.component';
import type { LoginPayload, RegisterPayload } from './auth-form/types/auth-form.types';

@Component({
  selector: 'kwd-portal-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, AuthForm],
  templateUrl: './login.component.html',
})
export default class Login implements OnInit, OnDestroy {
  public readonly mode = signal<'login' | 'register'>('login');
  public readonly loading = signal(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly infoMessage = signal<string | null>(null);
  private readonly authService: AuthService = inject(AuthService);
  private readonly router: Router = inject(Router);
  private readonly previousBodyOverflow = document.body.style.overflow;

  public ngOnInit(): void {
    document.body.style.overflow = 'hidden';
  }

  public ngOnDestroy(): void {
    document.body.style.overflow = this.previousBodyOverflow;
  }

  public async onLogin({ email, password }: LoginPayload): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.infoMessage.set(null);

    const result = await this.authService.login(email, password);

    if (!result.ok) {
      this.loading.set(false);
      this.errorMessage.set(
        this.authService.isEmailNotVerifiedError(result.code)
          ? 'Please verify your email before signing in — check your inbox.'
          : result.message,
      );
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
