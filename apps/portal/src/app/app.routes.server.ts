import { RenderMode, type ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'imprint', renderMode: RenderMode.Prerender },
  { path: 'terms-of-service', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'dashboard', renderMode: RenderMode.Client },
  { path: 'profile', renderMode: RenderMode.Client },
  { path: 'projects', renderMode: RenderMode.Client },
  { path: 'projects/new', renderMode: RenderMode.Client },
  { path: 'projects/import', renderMode: RenderMode.Client },
  { path: 'projects/:id', renderMode: RenderMode.Client },
  { path: 'websites', renderMode: RenderMode.Client },
  { path: 'websites/:id', renderMode: RenderMode.Client },
  { path: 'auth/error', renderMode: RenderMode.Client },
  { path: 'error', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
