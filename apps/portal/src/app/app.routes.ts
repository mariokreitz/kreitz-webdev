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
    title: 'Sign in — Kreitz-WebDev',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/login/login.component'),
  },
  {
    path: 'logout',
    title: 'Signing out — Kreitz-WebDev',
    loadComponent: () => import('./pages/logout/logout.component'),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-shell.component'),
    children: [
      {
        path: 'dashboard',
        title: 'Dashboard — Kreitz-WebDev',
        loadComponent: () => import('./pages/dashboard/dashboard.component'),
      },
    ],
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
    title: 'Error — Kreitz-WebDev',
    loadComponent: () => import('./pages/auth-error/auth-error.component'),
  },
  {
    path: 'error',
    title: 'Error — Kreitz-WebDev',
    loadComponent: () => import('./pages/error/error.component'),
  },
  {
    path: '**',
    title: 'Not Found — Kreitz-WebDev',
    loadComponent: () => import('./pages/not-found/not-found.component'),
  },
];
