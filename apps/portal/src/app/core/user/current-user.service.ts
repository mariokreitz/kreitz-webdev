import { Injectable, computed, inject, signal, type Signal, type WritableSignal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import type { UserProfile } from '../auth/types/auth.types';

type SessionStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

@Injectable({ providedIn: 'root' })
export class CurrentUserStore {
  private readonly authService: AuthService = inject(AuthService);

  private readonly profileSignal: WritableSignal<UserProfile | null> = signal(null);
  private readonly previousLoginAtSignal: WritableSignal<Date | null> = signal(null);
  private readonly sessionStatusSignal: WritableSignal<SessionStatus> = signal('idle');
  private readonly githubLinkedSignal: WritableSignal<boolean> = signal(false);

  public readonly profile: Signal<UserProfile | null> = this.profileSignal.asReadonly();
  public readonly previousLoginAt: Signal<Date | null> = this.previousLoginAtSignal.asReadonly();
  public readonly sessionStatus: Signal<SessionStatus> = this.sessionStatusSignal.asReadonly();
  public readonly isAuthenticated: Signal<boolean> = computed(() => this.profileSignal() !== null);
  public readonly githubLinked: Signal<boolean> = this.githubLinkedSignal.asReadonly();

  public async loadSession(): Promise<boolean> {
    this.sessionStatusSignal.set('loading');
    const session = await this.authService.getSession();
    this.profileSignal.set(session?.user ?? null);
    this.previousLoginAtSignal.set(session?.user.previousLoginAt ?? null);
    this.sessionStatusSignal.set(session ? 'authenticated' : 'unauthenticated');

    if (session) {
      const providers = await this.authService.listLinkedProviders();
      this.githubLinkedSignal.set(providers.includes('github'));
    } else {
      this.githubLinkedSignal.set(false);
    }

    return session !== null;
  }

  public clear(): void {
    this.profileSignal.set(null);
    this.previousLoginAtSignal.set(null);
    this.sessionStatusSignal.set('unauthenticated');
    this.githubLinkedSignal.set(false);
  }
}
