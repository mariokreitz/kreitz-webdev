import { NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';
import type { SidebarUser } from '../sidebar/sidebar.types';

@Component({
  selector: 'kwd-ui-user-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [FontAwesomeModule, NgOptimizedImage, TranslatePipe],
  templateUrl: './user-chip.component.html',
})
export class UserChip {
  public readonly user = input.required<SidebarUser>();
  public readonly signOut = output();

  public readonly signOutIcon = faRightFromBracket;

  public readonly initials: Signal<string> = computed(() =>
    this.user()
      .name.trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join(''),
  );

  private readonly avatarFailedSignal: WritableSignal<boolean> = signal(false);

  public readonly avatarUrl: Signal<string | null> = computed(() => {
    if (this.avatarFailedSignal()) {
      return null;
    }
    return this.user().avatarUrl ?? null;
  });

  public onAvatarError(): void {
    this.avatarFailedSignal.set(true);
  }
}
