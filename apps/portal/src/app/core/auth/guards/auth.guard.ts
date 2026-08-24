import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { LOGIN_ROUTE } from '../constants';
import { CurrentUserStore } from '../../user';

export const authGuard: CanActivateFn = async () => {
  const currentUserStore = inject(CurrentUserStore);
  const router = inject(Router);
  const isAuthenticated = await currentUserStore.loadSession();
  return isAuthenticated ? true : router.createUrlTree([LOGIN_ROUTE]);
};
