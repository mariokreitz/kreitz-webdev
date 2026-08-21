import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth';
import { AuthForm } from './auth-form/auth-form.component';
import type { LoginPayload, RegisterPayload } from './auth-form/types/auth-form.types';

type SuccessState = { kind: 'signed-in'; email: string } | { kind: 'check-email'; email: string };

@Component({
  selector: 'kwd-portal-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AuthForm],
  templateUrl: './login.component.html',
})
export default class Login {
  public readonly mode = signal<'login' | 'register'>('login');
  public readonly loading = signal(false);
  public readonly errorMessage = signal<string | null>(null);
  public readonly successState = signal<SuccessState | null>(null);
  private readonly authService: AuthService = inject(AuthService);

  public async onLogin({ email, password }: LoginPayload): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.successState.set(null);

    const result = await this.authService.login(email, password);

    this.loading.set(false);

    if (!result.ok) {
      this.errorMessage.set(
        this.authService.isEmailNotVerifiedError(result.code)
          ? 'Please verify your email before signing in — check your inbox.'
          : result.message,
      );
      return;
    }

    this.successState.set({ kind: 'signed-in', email: result.email });
  }

  public async onRegister({ email, password, name }: RegisterPayload): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.successState.set(null);

    const result = await this.authService.register(email, password, name);

    this.loading.set(false);

    if (!result.ok) {
      this.errorMessage.set(result.message);
      return;
    }

    this.successState.set({ kind: 'check-email', email: result.email });
  }

  public onToggleMode(): void {
    this.mode.update((mode) => (mode === 'login' ? 'register' : 'login'));
    this.errorMessage.set(null);
    this.successState.set(null);
  }
}
