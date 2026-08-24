import type { Route } from '@angular/router';
import { authGuard, guestGuard } from './core/auth';
import { githubLinkedGuard } from './core/projects';

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
      {
        path: 'profile',
        title: 'Profile — Kreitz-WebDev',
        loadComponent: () => import('./pages/profile/profile.component'),
      },
      {
        path: 'projects',
        title: 'Projects — Kreitz-WebDev',
        loadComponent: () => import('./pages/projects/projects.component'),
      },
      {
        path: 'projects/new',
        title: 'New Project — Kreitz-WebDev',
        loadComponent: () => import('./pages/projects/project-create/project-create.component'),
      },
      {
        path: 'projects/import',
        title: 'Import from GitHub — Kreitz-WebDev',
        canActivate: [githubLinkedGuard],
        loadComponent: () => import('./pages/projects/project-import/project-import.component'),
      },
      {
        path: 'projects/:id',
        title: 'Project — Kreitz-WebDev',
        loadComponent: () => import('./pages/projects/project-detail/project-detail.component'),
      },
      {
        path: 'websites',
        title: 'Websites — Kreitz-WebDev',
        loadComponent: () => import('./pages/websites/websites.component'),
      },
      {
        path: 'websites/:id',
        title: 'Website — Kreitz-WebDev',
        loadComponent: () => import('./pages/websites/website-detail/website-detail.component'),
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
