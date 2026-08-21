import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, LOGIN_ROUTE } from '../../core/auth';

@Component({
  selector: 'kwd-portal-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
})
export default class Dashboard {
  public readonly loggingOut = signal(false);
  private readonly authService: AuthService = inject(AuthService);
  private readonly router: Router = inject(Router);

  public async onLogout(): Promise<void> {
    this.loggingOut.set(true);

    await this.authService.logout();
    await this.router.navigateByUrl(LOGIN_ROUTE);
  }
}
