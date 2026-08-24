import { ChangeDetectionStrategy, Component, computed, inject, type Signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeToggle } from '@shared/ui';
import { ThemeService, type Theme } from './core/theme';

@Component({
  imports: [RouterOutlet, ThemeToggle],
  selector: 'kwd-portal-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
})
export class App {
  private readonly themeService: ThemeService = inject(ThemeService);

  public readonly theme: Signal<Theme> = computed(() => this.themeService.theme());

  public toggleTheme(): void {
    this.themeService.toggle();
  }
}
