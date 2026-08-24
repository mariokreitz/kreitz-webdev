import { inject } from '@angular/core';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { CurrentUserStore } from '../../user';
import { PROJECTS_ROUTE } from '../constants';

export const githubLinkedGuard: CanActivateFn = () => {
  const currentUserStore = inject(CurrentUserStore);
  const router = inject(Router);

  return currentUserStore.githubLinked() ? true : router.createUrlTree([PROJECTS_ROUTE]);
};
