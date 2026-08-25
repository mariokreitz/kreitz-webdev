import { ChangeDetectionStrategy, Component, computed, input, output, type Signal } from '@angular/core';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'kwd-ui-theme-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FontAwesomeModule, TranslatePipe],
  templateUrl: './theme-toggle.component.html',
})
export class ThemeToggle {
  public readonly theme = input.required<'light' | 'dark'>();
  public readonly toggleTheme = output();

  public readonly icon: Signal<IconDefinition> = computed(() => (this.theme() === 'dark' ? faSun : faMoon));
  public readonly label: Signal<string> = computed(() =>
    this.theme() === 'dark' ? 'common.themeToggle.toLight' : 'common.themeToggle.toDark',
  );
}
