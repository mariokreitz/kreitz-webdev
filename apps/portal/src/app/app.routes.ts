import type { Route } from '@angular/router';
import { authGuard, guestGuard } from './core/auth';
import { githubLinkedGuard } from './core/projects';
import type { TitleRouteData } from './core/title';

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
    path: 'logout',
    data: { titleKey: 'portal.title.logout' } satisfies TitleRouteData,
    loadComponent: () => import('./pages/logout/logout.component'),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/app-shell.component'),
    children: [
      {
        path: 'dashboard',
        data: { titleKey: 'portal.title.dashboard' } satisfies TitleRouteData,
        loadComponent: () => import('./pages/dashboard/dashboard.component'),
      },
      {
        path: 'profile',
        data: { titleKey: 'portal.title.profile' } satisfies TitleRouteData,
        loadComponent: () => import('./pages/profile/profile.component'),
      },
      {
        path: 'projects',
        data: { titleKey: 'portal.title.projects' } satisfies TitleRouteData,
        loadComponent: () => import('./pages/projects/projects.component'),
      },
      {
        path: 'projects/new',
        data: { titleKey: 'portal.title.projectNew' } satisfies TitleRouteData,
        loadComponent: () => import('./pages/projects/project-create/project-create.component'),
      },
      {
        path: 'projects/import',
        data: { titleKey: 'portal.title.projectImport' } satisfies TitleRouteData,
        canActivate: [githubLinkedGuard],
        loadComponent: () => import('./pages/projects/project-import/project-import.component'),
      },
      {
        path: 'projects/:id',
        data: { titleKey: 'portal.title.projectDetail' } satisfies TitleRouteData,
        loadComponent: () => import('./pages/projects/project-detail/project-detail.component'),
      },
      {
        path: 'websites',
        data: { titleKey: 'portal.title.websites' } satisfies TitleRouteData,
        loadComponent: () => import('./pages/websites/websites.component'),
      },
      {
        path: 'websites/:id',
        data: { titleKey: 'portal.title.websiteDetail' } satisfies TitleRouteData,
        loadComponent: () => import('./pages/websites/website-detail/website-detail.component'),
      },
    ],
  },
  {
    path: 'imprint',
    data: { titleKey: 'portal.title.imprint' } satisfies TitleRouteData,
    loadComponent: () => import('./pages/imprint/imprint.component'),
  },
  {
    path: 'terms-of-service',
    data: { titleKey: 'portal.title.termsOfService' } satisfies TitleRouteData,
    loadComponent: () => import('./pages/tos/tos.component'),
  },
  {
    path: 'auth/error',
    data: { titleKey: 'portal.title.error' } satisfies TitleRouteData,
    loadComponent: () => import('./pages/auth-error/auth-error.component'),
  },
  {
    path: 'error',
    data: { titleKey: 'portal.title.error' } satisfies TitleRouteData,
    loadComponent: () => import('./pages/error/error.component'),
  },
  {
    path: '**',
    data: { titleKey: 'portal.title.notFound' } satisfies TitleRouteData,
    loadComponent: () => import('./pages/not-found/not-found.component'),
  },
];
