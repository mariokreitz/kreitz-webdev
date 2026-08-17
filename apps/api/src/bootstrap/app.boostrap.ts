import type { AppConfig, SecurityConfig } from '@app/config';
import { ArcjetAuthMiddleware } from '@app/core/auth/arcjet-auth.middleware';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { Express, NextFunction, Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';
import { join } from 'node:path';

export const API_GLOBAL_PREFIX = 'api';
export const ROBOTS_PATH = '/robots.txt';
export const ROBOTS_DISALLOW_ALL_BODY = 'User-agent: *\nDisallow: /\n';

export interface BootstrapContext {
  config: AppConfig;
  security: SecurityConfig;
}

export function configureApplication(app: INestApplication, context: BootstrapContext): void {
  const { config, security } = context;
  const expressApp = app.getHttpAdapter().getInstance() as Express;

  hardenExpressInstance(expressApp, security);
  registerRobotsRoute(expressApp);
  applyArcjetAuthProtection(app, expressApp);

  app.setGlobalPrefix(API_GLOBAL_PREFIX);

  applySecurityHeaders(app, config.isProduction);
  applyCookies(app, security);
  serveWellKnownAssets(expressApp);
  applyCors(app, security);
  applyValidation(app, config.isProduction);

  app.enableShutdownHooks();
}

function hardenExpressInstance(expressApp: Express, security: SecurityConfig): void {
  expressApp.set('etag', false);
  expressApp.disable('x-powered-by');

  if (security.trustProxy) {
    expressApp.set('trust proxy', security.proxyHops);
  }
}

function applyArcjetAuthProtection(app: INestApplication, expressApp: Express): void {
  const arcjetAuthMiddleware = app.get(ArcjetAuthMiddleware);

  expressApp.use(async (req: Request, res: Response, next: NextFunction) => arcjetAuthMiddleware.use(req, res, next));
}

function registerRobotsRoute(expressApp: Express): void {
  expressApp.get(ROBOTS_PATH, (_request: Request, response: Response) => {
    response.type('text/plain').send(ROBOTS_DISALLOW_ALL_BODY);
  });
}

function applySecurityHeaders(app: INestApplication, isProduction: boolean): void {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      hsts: isProduction ? { maxAge: 31_536_000, includeSubDomains: true, preload: true } : false,
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
}

function applyCookies(app: INestApplication, security: SecurityConfig): void {
  app.use(cookieParser(security.cookieSecret));
}

function serveWellKnownAssets(expressApp: Express): void {
  expressApp.use(express.static(join(__dirname, 'public'), { index: false, dotfiles: 'allow' }));
}

function applyCors(app: INestApplication, security: SecurityConfig): void {
  if (security.corsOrigins.length === 0) {
    return;
  }

  app.enableCors({
    origin: security.corsOrigins,
    credentials: security.corsCredentials,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Lang'],
    maxAge: 86_400,
  });
}

function applyValidation(app: INestApplication, isProduction: boolean): void {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
      transformOptions: { enableImplicitConversion: false },
      disableErrorMessages: isProduction,
    }),
  );
}
