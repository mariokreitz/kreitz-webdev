import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal, untracked } from '@angular/core';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { form, FormField, submit, validateStandardSchema } from '@angular/forms/signals';
import { Button, OauthButton } from '@shared/ui';
import * as z from 'zod';
import type { LoginPayload, RegisterPayload } from './types/auth-form.types';

const loginSchema = z.object({
  email: z.email('Please enter a valid email address.'),
  password: z.string().min(1, 'Please enter your password.'),
});

const registerSchema = z.object({
  name: z.string().min(1, 'Please enter your name.'),
  email: z.email('Please enter a valid email address.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
});

@Component({
  selector: 'kwd-portal-auth-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormField, Button, OauthButton],
  templateUrl: './auth-form.component.html',
})
export class AuthForm {
  public readonly mode = input.required<'login' | 'register'>();
  public readonly loading = input(false);
  public readonly errorMessage = input<string | null>(null);

  public readonly faGithub = faGithub;
  public readonly faArrowRight = faArrowRight;

  public readonly login = output<LoginPayload>();
  public readonly register = output<RegisterPayload>();
  public readonly toggleMode = output();
  public readonly githubLogin = output();

  public readonly isRegister = computed(() => this.mode() === 'register');

  public readonly loginModel = signal<z.infer<typeof loginSchema>>({ email: '', password: '' });
  public readonly registerModel = signal<z.infer<typeof registerSchema>>({ name: '', email: '', password: '' });

  public readonly loginForm = form(this.loginModel, (path) => {
    validateStandardSchema(path, loginSchema);
  });

  public readonly registerForm = form(this.registerModel, (path) => {
    validateStandardSchema(path, registerSchema);
  });

  constructor() {
    effect(() => {
      this.mode();

      untracked(() => {
        this.loginModel.set({ email: '', password: '' });
        this.registerModel.set({ name: '', email: '', password: '' });
        this.loginForm().reset();
        this.registerForm().reset();
      });
    });
  }

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

  public onGithubLogin(): void {
    if (this.loading()) {
      return;
    }

    this.githubLogin.emit();
  }
}
