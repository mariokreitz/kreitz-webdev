import { RenderMode, type ServerRoute } from '@angular/ssr';
import { APP_ROUTE_PATHS } from './core/routing';

export const serverRoutes: ServerRoute[] = [
  { path: APP_ROUTE_PATHS.home, renderMode: RenderMode.Server },
  { path: APP_ROUTE_PATHS.imprint, renderMode: RenderMode.Server },
  { path: APP_ROUTE_PATHS.privacyPolicy, renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Client },
];
