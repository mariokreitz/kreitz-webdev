import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { LOGIN_ROUTE } from '../constants';
import { AuthService } from '../auth.service';

export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const hasActiveSession = await authService.hasActiveSession();

  return hasActiveSession ? true : router.createUrlTree([LOGIN_ROUTE]);
};
