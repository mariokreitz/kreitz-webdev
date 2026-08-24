import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { DASHBOARD_ROUTE } from '../constants';
import { CurrentUserStore } from '../../user';

export const guestGuard: CanActivateFn = async () => {
  const currentUserStore = inject(CurrentUserStore);
  const router = inject(Router);
  const isAuthenticated = await currentUserStore.loadSession();
  return isAuthenticated ? router.createUrlTree([DASHBOARD_ROUTE]) : true;
};
