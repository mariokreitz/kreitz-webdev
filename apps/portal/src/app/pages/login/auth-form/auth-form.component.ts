import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { form, FormField, submit, validateStandardSchema } from '@angular/forms/signals';
import * as z from 'zod';
import type { LoginPayload, RegisterPayload } from './types/auth-form.types';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
});

@Component({
  selector: 'kwd-portal-auth-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField],
  templateUrl: './auth-form.component.html',
})
export class AuthForm {
  public readonly mode = input.required<'login' | 'register'>();
  public readonly loading = input(false);
  public readonly errorMessage = input<string | null>(null);

  public readonly login = output<LoginPayload>();
  public readonly register = output<RegisterPayload>();
  public readonly toggleMode = output();

  public readonly isRegister = computed(() => this.mode() === 'register');

  public readonly loginModel = signal<z.infer<typeof loginSchema>>({ email: '', password: '' });
  public readonly registerModel = signal<z.infer<typeof registerSchema>>({ name: '', email: '', password: '' });

  public readonly loginForm = form(this.loginModel, (path) => {
    validateStandardSchema(path, loginSchema);
  });

  public readonly registerForm = form(this.registerModel, (path) => {
    validateStandardSchema(path, registerSchema);
  });

  public async onLoginSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    await submit(this.loginForm, async () => {
      this.login.emit(this.loginModel());
    });
  }

  public async onRegisterSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    await submit(this.registerForm, async () => {
      this.register.emit(this.registerModel());
    });
  }

  public onToggleMode(): void {
    this.toggleMode.emit();
  }
}
