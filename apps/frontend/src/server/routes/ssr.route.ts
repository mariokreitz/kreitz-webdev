import { writeResponseToNodeResponse, type AngularNodeAppEngine } from '@angular/ssr/node';
import type { Express, NextFunction, Request, Response } from 'express';

import { APP_ROUTE_PATHS } from '../../app/core/routing';
import type { HomeRequestContext } from '../../app/core/ssr';
import { fetchCvAvailable } from '../fetch-cv-status';
import { fetchPublicCompanies } from '../fetch-public-companies';
import { fetchPublicProjects } from '../fetch-public-projects';

interface AppRequestContext extends Partial<HomeRequestContext> {
  readonly cvAvailable: boolean;
}

const KNOWN_APP_PATHS: ReadonlySet<string> = new Set(
  Object.values(APP_ROUTE_PATHS).map((path) => (path ? `/${path}` : '/')),
);

export function registerSsrRoute(app: Express, angularApp: AngularNodeAppEngine, apiBaseUrl: string): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    void handleRequest(angularApp, apiBaseUrl, req, res, next);
  });
}

async function buildHomeRequestContext(apiBaseUrl: string): Promise<HomeRequestContext> {
  const [projects, companies] = await Promise.all([fetchPublicProjects(apiBaseUrl), fetchPublicCompanies(apiBaseUrl)]);

  return { projects, companies };
}

async function handleRequest(
  angularApp: AngularNodeAppEngine,
  apiBaseUrl: string,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const normalizedPath = req.path.length > 1 ? req.path.replace(/\/+$/, '') : req.path;
    const isKnownAppPath = KNOWN_APP_PATHS.has(normalizedPath);

    const [cvAvailable, homeContext] = await Promise.all([
      isKnownAppPath ? fetchCvAvailable(apiBaseUrl) : Promise.resolve(false),
      normalizedPath === '/' ? buildHomeRequestContext(apiBaseUrl) : Promise.resolve(undefined),
    ]);

    const requestContext: AppRequestContext = { cvAvailable, ...homeContext };

    const response = await angularApp.handle(req, requestContext);

    if (response) {
      await writeResponseToNodeResponse(response, res);
    } else {
      next();
    }
  } catch (error) {
    next(error);
  }
}
