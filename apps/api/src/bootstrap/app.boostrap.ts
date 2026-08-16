import type { AppConfig, SecurityConfig, securityConfig } from '@app/config';
import { type INestApplication, ValidationPipe } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import type { Express, Request, Response } from 'express';
import express, { json, urlencoded } from 'express';
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

  app.setGlobalPrefix(API_GLOBAL_PREFIX);

  applySecurityHeaders(app, config.isProduction);
  applyCookiesAndBodyParsers(app, security);
  serveWellKnownAssets(expressApp);
  applyCors(app, security);
  applyValidation(app, config.isProduction);

  app.enableShutdownHooks();
}

function hardenExpressInstance(expressApp: Express, security: ConfigType<typeof securityConfig>): void {
  expressApp.set('etag', false);
  expressApp.disable('x-powered-by');

  if (security.trustProxy) {
    expressApp.set('trust proxy', security.proxyHops);
  }
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

function applyCookiesAndBodyParsers(app: INestApplication, security: ConfigType<typeof securityConfig>): void {
  app.use(cookieParser(security.cookieSecret));
  app.use(json({ limit: security.bodyLimit }));
  app.use(urlencoded({ extended: false, limit: security.bodyLimit }));
}

function serveWellKnownAssets(expressApp: Express): void {
  expressApp.use('/.well-known', express.static(join(__dirname, '..', 'public'), { index: false, dotfiles: 'allow' }));
}

function applyCors(app: INestApplication, security: ConfigType<typeof securityConfig>): void {
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
