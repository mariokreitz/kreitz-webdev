import { writeResponseToNodeResponse, type AngularNodeAppEngine } from '@angular/ssr/node';
import type { Express, NextFunction, Request, Response } from 'express';

import type { HomeRequestContext } from '../../app/core/ssr';
import { fetchCvAvailable } from '../fetch-cv-status';
import { fetchPublicCompanies } from '../fetch-public-companies';
import { fetchPublicProjects } from '../fetch-public-projects';

export function registerSsrRoute(app: Express, angularApp: AngularNodeAppEngine, apiBaseUrl: string): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    void handleRequest(angularApp, apiBaseUrl, req, res, next);
  });
}

async function buildHomeRequestContext(apiBaseUrl: string): Promise<HomeRequestContext> {
  const [projects, companies, cvAvailable] = await Promise.all([
    fetchPublicProjects(apiBaseUrl),
    fetchPublicCompanies(apiBaseUrl),
    fetchCvAvailable(apiBaseUrl),
  ]);

  return { projects, companies, cvAvailable };
}

async function handleRequest(
  angularApp: AngularNodeAppEngine,
  apiBaseUrl: string,
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const requestContext: HomeRequestContext | undefined =
      req.path === '/' ? await buildHomeRequestContext(apiBaseUrl) : undefined;

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
