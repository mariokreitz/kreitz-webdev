import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Card, Spinner } from '@shared/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService, LOGIN_ROUTE } from '../../core/auth';
import { CurrentUserStore } from '../../core/user';

@Component({
  selector: 'kwd-portal-logout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Card, Spinner, TranslatePipe],
  templateUrl: './logout.component.html',
})
export default class Logout {
  private readonly authService: AuthService = inject(AuthService);
  private readonly currentUserStore: CurrentUserStore = inject(CurrentUserStore);
  private readonly router: Router = inject(Router);

  constructor() {
    void this.performLogout();
  }

  private async performLogout(): Promise<void> {
    try {
      await this.authService.logout();
    } finally {
      this.currentUserStore.clear();
      await this.router.navigateByUrl(LOGIN_ROUTE);
    }
  }
}
