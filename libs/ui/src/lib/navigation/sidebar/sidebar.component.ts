import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { NavItem } from '../nav-item/nav-item.component';
import { UserChip } from '../../data-display/user-chip/user-chip.component';
import type { NavItemConfig, SidebarUser } from './sidebar.types';

@Component({
  selector: 'kwd-ui-sidebar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [NavItem, UserChip],
  templateUrl: './sidebar.component.html',
})
export class Sidebar {
  public readonly items = input.required<readonly NavItemConfig[]>();
  public readonly user = input<SidebarUser | null>(null);
  public readonly signOut = output();
}
