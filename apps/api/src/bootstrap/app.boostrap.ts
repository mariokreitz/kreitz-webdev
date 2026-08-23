import type { AppConfig, SecurityConfig } from '@app/config';
import { ArcjetAuthMiddleware, AUTH_REFERENCE_CSP_NONCE, AUTH_REFERENCE_PATH } from '@app/core/auth';
import { type INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import type { Express, NextFunction, Request, Response } from 'express';
import express from 'express';
import helmet from 'helmet';
import { join } from 'node:path';

export { AUTH_REFERENCE_PATH };

export const API_GLOBAL_PREFIX = 'api';
export const API_DEFAULT_VERSION = '1';
export const ROBOTS_PATH = '/robots.txt';
export const ROBOTS_DISALLOW_ALL_BODY = 'User-agent: *\nDisallow: /\n';
const SCALAR_CDN_ORIGIN = 'https://cdn.jsdelivr.net';

export interface BootstrapContext {
  readonly config: AppConfig;
  readonly security: SecurityConfig;
}

export function configureApplication(app: NestExpressApplication, context: BootstrapContext): void {
  const { config, security } = context;
  const expressApp = app.getHttpAdapter().getInstance();

  hardenExpressInstance(expressApp, security);
  registerRobotsRoute(expressApp);
  applyArcjetAuthProtection(app, expressApp);

  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  applyVersioning(app);

  applySecurityHeaders(app, config.isProduction);
  applyAuthReferenceCsp(expressApp, security.enableSwagger);
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

function applyVersioning(app: INestApplication): void {
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: API_DEFAULT_VERSION,
  });
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
          connectSrc: ["'self'"],
        },
      },
      hsts: isProduction ? { maxAge: 31_536_000, includeSubDomains: true, preload: true } : false,
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'no-referrer' },
    }),
  );
}

function applyAuthReferenceCsp(expressApp: Express, enabled: boolean): void {
  if (!enabled) {
    return;
  }

  expressApp.use(
    AUTH_REFERENCE_PATH,
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", `'nonce-${AUTH_REFERENCE_CSP_NONCE}'`, SCALAR_CDN_ORIGIN],
          styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'https:', 'data:'],
          connectSrc: ["'self'", SCALAR_CDN_ORIGIN],
          workerSrc: ["'self'", 'blob:'],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
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
