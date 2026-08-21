import type { Route } from '@angular/router';
import { authGuard, guestGuard } from './core/auth';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component'),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component'),
  },
  {
    path: 'imprint',
    loadComponent: () => import('./pages/imprint/imprint.component'),
  },
  {
    path: 'terms-of-service',
    loadComponent: () => import('./pages/tos/tos.component'),
  },
  {
    path: 'auth/error',
    loadComponent: () => import('./pages/auth-error/auth-error.component'),
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component'),
  },
];
