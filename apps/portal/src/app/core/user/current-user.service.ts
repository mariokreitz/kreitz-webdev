import { Injectable, computed, inject, signal, type Signal, type WritableSignal } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import type { UserProfile } from '../auth/types/auth.types';

type SessionStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

@Injectable({ providedIn: 'root' })
export class CurrentUserStore {
  private readonly authService: AuthService = inject(AuthService);

  private readonly profileSignal: WritableSignal<UserProfile | null> = signal(null);
  private readonly sessionCreatedAtSignal: WritableSignal<Date | null> = signal(null);
  private readonly sessionStatusSignal: WritableSignal<SessionStatus> = signal('idle');

  public readonly profile: Signal<UserProfile | null> = this.profileSignal.asReadonly();
  public readonly sessionCreatedAt: Signal<Date | null> = this.sessionCreatedAtSignal.asReadonly();
  public readonly sessionStatus: Signal<SessionStatus> = this.sessionStatusSignal.asReadonly();
  public readonly isAuthenticated: Signal<boolean> = computed(() => this.profileSignal() !== null);

  public async loadSession(): Promise<boolean> {
    this.sessionStatusSignal.set('loading');
    const session = await this.authService.getSession();
    this.profileSignal.set(session?.user ?? null);
    this.sessionCreatedAtSignal.set(session?.session.createdAt ?? null);
    this.sessionStatusSignal.set(session ? 'authenticated' : 'unauthenticated');
    return session !== null;
  }

  public clear(): void {
    this.profileSignal.set(null);
    this.sessionCreatedAtSignal.set(null);
    this.sessionStatusSignal.set('unauthenticated');
  }
}
