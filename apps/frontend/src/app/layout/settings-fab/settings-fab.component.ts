import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faGear } from '@fortawesome/free-solid-svg-icons';
import { ThemeToggle } from '@shared/ui';
import { ThemeService, type Theme } from '../../core/theme';

@Component({
  selector: 'kwd-frontend-settings-fab',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, ThemeToggle, TranslatePipe],
  templateUrl: './settings-fab.component.html',
})
export class SettingsFab {
  private readonly themeService: ThemeService = inject(ThemeService);

  private readonly hoveredSignal: WritableSignal<boolean> = signal(false);
  private readonly pinnedOpenSignal: WritableSignal<boolean> = signal(false);

  protected readonly theme: Signal<Theme> = computed(() => this.themeService.theme());
  protected readonly expanded: Signal<boolean> = computed(() => this.hoveredSignal() || this.pinnedOpenSignal());
  protected readonly gearIcon: IconDefinition = faGear;

  protected onPointerEnter(): void {
    this.hoveredSignal.set(true);
  }

  protected onPointerLeave(): void {
    this.hoveredSignal.set(false);
  }

  protected toggleExpanded(): void {
    this.pinnedOpenSignal.update((pinnedOpen) => !pinnedOpen);
  }

  protected toggleTheme(): void {
    this.themeService.toggle();
  }
}
