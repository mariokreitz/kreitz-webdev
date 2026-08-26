import type { Route } from '@angular/router';
import { APP_ROUTE_PATHS } from './core/routing';

export const appRoutes: Route[] = [
  {
    path: APP_ROUTE_PATHS.home,
    loadComponent: () => import('./pages/home/home.component').then((m) => m.Home),
  },
  {
    path: APP_ROUTE_PATHS.imprint,
    loadComponent: () => import('./pages/imprint/imprint.component').then((m) => m.Imprint),
  },
  {
    path: APP_ROUTE_PATHS.privacyPolicy,
    loadComponent: () => import('./pages/privacy-policy/privacy-policy.component').then((m) => m.PrivacyPolicy),
  },
];
