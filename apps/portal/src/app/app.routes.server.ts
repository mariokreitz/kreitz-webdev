import { RenderMode, type ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: 'imprint', renderMode: RenderMode.Prerender },
  { path: 'terms-of-service', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'dashboard', renderMode: RenderMode.Client },
  { path: 'auth/error', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
