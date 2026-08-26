import type { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.Home),
  },
  {
    path: 'imprint',
    loadComponent: () => import('./pages/imprint/imprint.component').then((m) => m.Imprint),
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./pages/privacy-policy/privacy-policy.component').then((m) => m.PrivacyPolicy),
  },
];
