import type { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component'),
  },
  {
    path: 'imprint',
    loadComponent: () => import('./pages/imprint/imprint.component'),
  },
  {
    path: 'terms-of-service',
    loadComponent: () => import('./pages/tos/tos.component'),
  },
];
