import { ViewportScroller } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, type Signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Switch } from '@shared/ui';
import { ThemeService, type Theme } from '../../core/theme';

const ANCHOR_SCROLL_OFFSET_PX = 96;

@Component({
  selector: 'kwd-frontend-nav-island',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Switch, TranslatePipe, RouterLink],
  templateUrl: './nav-island.component.html',
})
export class NavIsland {
  private readonly themeService: ThemeService = inject(ThemeService);
  private readonly viewportScroller: ViewportScroller = inject(ViewportScroller);

  protected readonly theme: Signal<Theme> = computed(() => this.themeService.theme());

  constructor() {
    // Router's anchor scroll uses getBoundingClientRect math, not scrollIntoView, so scroll-margin-top is ignored.
    this.viewportScroller.setOffset([0, ANCHOR_SCROLL_OFFSET_PX]);
  }

  protected toggleTheme(): void {
    this.themeService.toggle();
  }
}
