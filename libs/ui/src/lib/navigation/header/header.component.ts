import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';
import { ThemeToggle } from '../../forms/theme-toggle/theme-toggle.component';
import type { SidebarUser } from '../sidebar/sidebar.types';

@Component({
  selector: 'kwd-ui-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [FontAwesomeModule, ThemeToggle, TranslatePipe],
  templateUrl: './header.component.html',
})
export class Header {
  public readonly theme = input.required<'light' | 'dark'>();
  public readonly user = input<SidebarUser | null>(null);
  public readonly toggleTheme = output();
  public readonly signOut = output();

  public readonly signOutIcon = faRightFromBracket;
}
