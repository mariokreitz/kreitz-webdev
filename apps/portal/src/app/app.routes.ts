import type { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: 'imprint',
    loadComponent: () => import('./pages/imprint/imprint').then((m) => m.Imprint),
  },
  {
    path: 'terms-of-service',
    loadComponent: () => import('./pages/terms-of-service/terms-of-service').then((m) => m.TermsOfService),
  },
];
