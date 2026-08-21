import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { DASHBOARD_ROUTE } from '../constants';
import { AuthService } from '../auth.service';

export const guestGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const hasActiveSession = await authService.hasActiveSession();

  return hasActiveSession ? router.createUrlTree([DASHBOARD_ROUTE]) : true;
};
