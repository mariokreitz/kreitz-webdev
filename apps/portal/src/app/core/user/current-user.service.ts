import { Injectable, computed, inject, signal, type Signal, type WritableSignal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import type { UserProfile } from '../auth/types/auth.types';

type SessionStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

@Injectable({ providedIn: 'root' })
export class CurrentUserStore {
  private readonly authService: AuthService = inject(AuthService);

  private readonly profileSignal: WritableSignal<UserProfile | null> = signal(null);
  private readonly sessionStatusSignal: WritableSignal<SessionStatus> = signal('idle');

  public readonly profile: Signal<UserProfile | null> = this.profileSignal.asReadonly();
  public readonly sessionStatus: Signal<SessionStatus> = this.sessionStatusSignal.asReadonly();
  public readonly isAuthenticated: Signal<boolean> = computed(() => this.profileSignal() !== null);

  public async loadSession(): Promise<boolean> {
    this.sessionStatusSignal.set('loading');
    const profile = await this.authService.getProfile();
    this.profileSignal.set(profile);
    this.sessionStatusSignal.set(profile ? 'authenticated' : 'unauthenticated');
    return profile !== null;
  }

  public clear(): void {
    this.profileSignal.set(null);
    this.sessionStatusSignal.set('unauthenticated');
  }
}
