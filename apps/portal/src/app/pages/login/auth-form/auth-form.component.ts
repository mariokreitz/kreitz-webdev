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
  readonly mode = input.required<'login' | 'register'>();
  readonly loading = input(false);
  readonly errorMessage = input<string | null>(null);

  readonly login = output<LoginPayload>();
  readonly register = output<RegisterPayload>();
  readonly toggleMode = output();

  readonly isRegister = computed(() => this.mode() === 'register');

  readonly loginModel = signal<z.infer<typeof loginSchema>>({ email: '', password: '' });
  readonly registerModel = signal<z.infer<typeof registerSchema>>({ name: '', email: '', password: '' });

  readonly loginForm = form(this.loginModel, (path) => {
    validateStandardSchema(path, loginSchema);
  });

  readonly registerForm = form(this.registerModel, (path) => {
    validateStandardSchema(path, registerSchema);
  });

  async onLoginSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    await submit(this.loginForm, async () => {
      this.login.emit(this.loginModel());
    });
  }

  async onRegisterSubmit(event: Event): Promise<void> {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    await submit(this.registerForm, async () => {
      this.register.emit(this.registerModel());
    });
  }

  onToggleMode(): void {
    this.toggleMode.emit();
  }
}
