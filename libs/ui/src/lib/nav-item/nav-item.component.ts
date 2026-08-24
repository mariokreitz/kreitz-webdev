import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'kwd-ui-nav-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  imports: [FontAwesomeModule, RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './nav-item.component.html',
})
export class NavItem {
  public readonly icon = input.required<IconDefinition>();
  public readonly label = input.required<string>();
  public readonly route = input.required<string>();
  public readonly variant = input<'sidebar' | 'bottom-nav'>('sidebar');
}
