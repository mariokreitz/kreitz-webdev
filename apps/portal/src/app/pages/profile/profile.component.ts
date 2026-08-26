import { ChangeDetectionStrategy, Component, computed, inject, signal, type Signal } from '@angular/core';
import { Card } from '@shared/ui';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/auth';
import { ToastService } from '../../core/toast';
import { CurrentUserStore } from '../../core/user';
import { CvCard } from './cv-card/cv-card.component';
import { DangerZoneCard } from './danger-zone-card/danger-zone-card.component';
import type { DiagnosticField } from './diagnostics-card/diagnostics-card.component';
import { DiagnosticsCard } from './diagnostics-card/diagnostics-card.component';
import { EditNameForm } from './edit-name-form/edit-name-form.component';
import { IdentityCard } from './identity-card/identity-card.component';

@Component({
  selector: 'kwd-portal-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, IdentityCard, EditNameForm, DiagnosticsCard, CvCard, DangerZoneCard, TranslatePipe],
  templateUrl: './profile.component.html',
})
export default class Profile {
  private readonly currentUserStore: CurrentUserStore = inject(CurrentUserStore);
  private readonly authService: AuthService = inject(AuthService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly translate: TranslateService = inject(TranslateService);

  public readonly isEditing = signal(false);
  public readonly saving = signal(false);
  public readonly errorMessage = signal<string | null>(null);

  public readonly displayName: Signal<string> = computed(() => this.currentUserStore.profile()?.name ?? '');
  public readonly email: Signal<string> = computed(() => this.currentUserStore.profile()?.email ?? '');
  public readonly avatarUrl: Signal<string | null> = computed(() => this.currentUserStore.profile()?.image ?? null);
  public readonly emailVerified: Signal<boolean> = computed(
    () => this.currentUserStore.profile()?.emailVerified ?? false,
  );

  public readonly diagnostics: Signal<readonly DiagnosticField[]> = computed(() => {
    const profile = this.currentUserStore.profile();
    const previousLoginAt = this.currentUserStore.previousLoginAt();

    if (!profile) {
      return [];
    }

    return [
      { label: 'profile.diagnostics.email', value: profile.email },
      {
        label: 'profile.diagnostics.emailVerified',
        value: this.translate.instant(profile.emailVerified ? 'common.yes' : 'common.no'),
      },
      { label: 'profile.diagnostics.registeredAt', value: new Date(profile.createdAt).toLocaleString() },
      { label: 'profile.diagnostics.lastUpdatedAt', value: new Date(profile.updatedAt).toLocaleString() },
      {
        label: 'profile.diagnostics.lastLogin',
        value: previousLoginAt?.toLocaleString() ?? this.translate.instant('profile.diagnostics.firstLogin'),
      },
    ];
  });

  public onEditRequested(): void {
    this.errorMessage.set(null);
    this.isEditing.set(true);
  }

  public onCancelEdit(): void {
    this.errorMessage.set(null);
    this.isEditing.set(false);
  }

  public async onSaveName(name: string): Promise<void> {
    this.saving.set(true);
    this.errorMessage.set(null);

    const result = await this.authService.updateName(name);

    if (!result.ok) {
      this.saving.set(false);
      this.errorMessage.set(result.message);
      return;
    }

    await this.currentUserStore.loadSession();
    this.saving.set(false);
    this.isEditing.set(false);
    this.toastService.show({ severity: 'success', message: this.translate.instant('profile.toast.nameUpdated') });
  }
}
