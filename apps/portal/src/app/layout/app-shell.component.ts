import { ChangeDetectionStrategy, Component, computed, inject, type Signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { faGauge } from '@fortawesome/free-solid-svg-icons';
import { Header, Sidebar, type NavItemConfig, type SidebarUser } from '@shared/ui';
import { LOGOUT_ROUTE } from '../core/auth';
import { ThemeService, type Theme } from '../core/theme';
import { CurrentUserStore } from '../core/user';

@Component({
  selector: 'kwd-portal-app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, Header, Sidebar],
  templateUrl: './app-shell.component.html',
})
export default class AppShell {
  public readonly navItems: readonly NavItemConfig[] = [{ icon: faGauge, label: 'Dashboard', route: '/dashboard' }];

  private readonly themeService: ThemeService = inject(ThemeService);
  private readonly currentUserStore: CurrentUserStore = inject(CurrentUserStore);
  private readonly router: Router = inject(Router);

  public readonly theme: Signal<Theme> = computed(() => this.themeService.theme());

  public readonly user: Signal<SidebarUser | null> = computed(() => {
    const profile = this.currentUserStore.profile();

    if (!profile) {
      return null;
    }

    return { name: profile.name, email: profile.email, avatarUrl: profile.image ?? null };
  });

  public toggleTheme(): void {
    this.themeService.toggle();
  }

  public onSignOut(): void {
    void this.router.navigateByUrl(LOGOUT_ROUTE);
  }
}
