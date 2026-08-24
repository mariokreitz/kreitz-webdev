import { ChangeDetectionStrategy, Component, computed, input, output, type Signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import type { SidebarUser } from '../sidebar/sidebar.types';

@Component({
  selector: 'kwd-ui-user-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [FontAwesomeModule],
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
}
