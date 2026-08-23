import type { AppConfig, SecurityConfig } from '@app/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';

const AUTH_REFERENCE_PATH = '/api/auth/reference';
const AUTH_REFERENCE_CSP_NONCE = 'test-csp-nonce';
const ARCJET_AUTH_MIDDLEWARE_TOKEN = Symbol('ArcjetAuthMiddleware');
const SCALAR_CDN_ORIGIN = 'https://cdn.jsdelivr.net';

jest.mock('helmet', () => jest.fn());
jest.mock('cookie-parser', () => jest.fn());
jest.mock('@app/core/auth', () => ({
  ArcjetAuthMiddleware: ARCJET_AUTH_MIDDLEWARE_TOKEN,
  AUTH_REFERENCE_PATH,
  AUTH_REFERENCE_CSP_NONCE,
}));

import { ArcjetAuthMiddleware } from '@app/core/auth';
import { VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';

import {
  API_DEFAULT_VERSION,
  API_GLOBAL_PREFIX,
  type BootstrapContext,
  configureApplication,
  ROBOTS_DISALLOW_ALL_BODY,
  ROBOTS_PATH,
} from '../app.boostrap';

interface MockHttpAdapter {
  getInstance: jest.Mock;
}

interface MockNestApp {
  getHttpAdapter: jest.Mock<MockHttpAdapter, []>;
  setGlobalPrefix: jest.Mock;
  enableVersioning: jest.Mock;
  use: jest.Mock;
  enableCors: jest.Mock;
  useGlobalPipes: jest.Mock;
  enableShutdownHooks: jest.Mock;
  get: jest.Mock;
}

interface MockExpressApp {
  set: jest.Mock;
  disable: jest.Mock;
  get: jest.Mock;
  use: jest.Mock;
}

interface MockArcjetMiddleware {
  use: jest.Mock;
}

const mockHelmet = jest.mocked(helmet);
const mockCookieParser = jest.mocked(cookieParser);

function buildExpressApp(): MockExpressApp {
  return {
    set: jest.fn(),
    disable: jest.fn(),
    get: jest.fn(),
    use: jest.fn(),
  };
}

function buildArcjetAuthMiddleware(): MockArcjetMiddleware {
  return { use: jest.fn() };
}

function buildApp(expressApp: MockExpressApp, arcjetAuthMiddleware: MockArcjetMiddleware): MockNestApp {
  return {
    getHttpAdapter: jest
      .fn<MockHttpAdapter, []>()
      .mockReturnValue({ getInstance: jest.fn().mockReturnValue(expressApp) }),
    setGlobalPrefix: jest.fn(),
    enableVersioning: jest.fn(),
    use: jest.fn(),
    enableCors: jest.fn(),
    useGlobalPipes: jest.fn(),
    enableShutdownHooks: jest.fn(),
    get: jest.fn().mockReturnValue(arcjetAuthMiddleware),
  };
}

function buildConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    env: 'test',
    port: 3000,
    logLevel: 'debug',
    logFormat: 'pretty',
    isProduction: false,
    ...overrides,
  };
}

function buildSecurity(overrides: Partial<SecurityConfig> = {}): SecurityConfig {
  return {
    corsOrigins: [],
    corsCredentials: false,
    bodyLimit: '100kb',
    cookieSecret: 'a'.repeat(32),
    enableSwagger: false,
    trustProxy: false,
    proxyHops: 0,
    ...overrides,
  };
}

function buildContext(overrides: {
  config?: Partial<AppConfig>;
  security?: Partial<SecurityConfig>;
}): BootstrapContext {
  return {
    config: buildConfig(overrides.config),
    security: buildSecurity(overrides.security),
  };
}

function buildResponse(): jest.Mocked<Pick<Response, 'type' | 'send'>> {
  const response = {
    type: jest.fn(),
    send: jest.fn(),
  } as unknown as jest.Mocked<Pick<Response, 'type' | 'send'>>;

  response.type.mockReturnValue(response as unknown as Response);

  return response;
}

describe('configureApplication', () => {
  let expressApp: MockExpressApp;
  let arcjetAuthMiddleware: MockArcjetMiddleware;
  let app: MockNestApp;
  let staticSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    expressApp = buildExpressApp();
    arcjetAuthMiddleware = buildArcjetAuthMiddleware();
    app = buildApp(expressApp, arcjetAuthMiddleware);
    staticSpy = jest.spyOn(express, 'static').mockReturnValue(jest.fn());
    mockHelmet.mockReturnValue(jest.fn());
    mockCookieParser.mockReturnValue(jest.fn());
  });

  afterEach(() => {
    staticSpy.mockRestore();
  });

  describe('express hardening', () => {
    it('disables etag generation and the x-powered-by header unconditionally', () => {
      configureApplication(app as unknown as NestExpressApplication, buildContext({}));

      expect(expressApp.set).toHaveBeenCalledWith('etag', false);
      expect(expressApp.disable).toHaveBeenCalledWith('x-powered-by');
    });

    it('sets trust proxy to the configured hop count when trustProxy is enabled', () => {
      configureApplication(
        app as unknown as NestExpressApplication,
        buildContext({ security: { trustProxy: true, proxyHops: 2 } }),
      );

      expect(expressApp.set).toHaveBeenCalledWith('trust proxy', 2);
    });

    it('does not touch trust proxy when trustProxy is disabled', () => {
      configureApplication(app as unknown as NestExpressApplication, buildContext({ security: { trustProxy: false } }));

      expect(expressApp.set).not.toHaveBeenCalledWith('trust proxy', expect.anything());
    });
  });

  describe('robots route', () => {
    it('registers a GET handler for the robots path that disallows all crawling', () => {
      configureApplication(app as unknown as NestExpressApplication, buildContext({}));

      expect(expressApp.get).toHaveBeenCalledWith(ROBOTS_PATH, expect.any(Function));

      const [, handler] = expressApp.get.mock.calls[0] as [string, (request: Request, response: Response) => void];
      const response = buildResponse();

      handler({} as Request, response as unknown as Response);

      expect(response.type).toHaveBeenCalledWith('text/plain');
      expect(response.send).toHaveBeenCalledWith(ROBOTS_DISALLOW_ALL_BODY);
    });
  });

  describe('arcjet auth protection', () => {
    it('resolves ArcjetAuthMiddleware from the app container and wires it onto the express instance', () => {
      configureApplication(app as unknown as NestExpressApplication, buildContext({}));

      expect(app.get).toHaveBeenCalledWith(ArcjetAuthMiddleware);
      expect(expressApp.use).toHaveBeenNthCalledWith(1, expect.any(Function));
    });

    it('delegates each request to the resolved middleware instance', async () => {
      configureApplication(app as unknown as NestExpressApplication, buildContext({}));

      const [wired] = expressApp.use.mock.calls[0] as [
        (request: Request, response: Response, next: NextFunction) => Promise<void>,
      ];
      const request = { path: '/api/auth/sign-in' } as Request;
      const response = {} as Response;
      const next = jest.fn();

      await wired(request, response, next);

      expect(arcjetAuthMiddleware.use).toHaveBeenCalledWith(request, response, next);
    });
  });

  describe('global prefix and versioning', () => {
    it('sets the global API prefix', () => {
      configureApplication(app as unknown as NestExpressApplication, buildContext({}));

      expect(app.setGlobalPrefix).toHaveBeenCalledWith(API_GLOBAL_PREFIX);
    });

    it('enables URI versioning with the configured default version', () => {
      configureApplication(app as unknown as NestExpressApplication, buildContext({}));

      expect(app.enableVersioning).toHaveBeenCalledWith({
        type: VersioningType.URI,
        prefix: 'v',
        defaultVersion: API_DEFAULT_VERSION,
      });
    });
  });

  describe('security headers', () => {
    it('applies the full deny-by-default CSP and security header set with hsts disabled outside production', () => {
      configureApplication(app as unknown as NestExpressApplication, buildContext({ config: { isProduction: false } }));

      expect(mockHelmet).toHaveBeenNthCalledWith(1, {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'none'"],
            frameAncestors: ["'none'"],
            baseUri: ["'none'"],
            formAction: ["'none'"],
            connectSrc: ["'self'"],
          },
        },
        hsts: false,
        crossOriginResourcePolicy: { policy: 'same-site' },
        referrerPolicy: { policy: 'no-referrer' },
      });
      expect(app.use).toHaveBeenCalledTimes(2);
    });

    it('enables hsts when running in production', () => {
      configureApplication(app as unknown as NestExpressApplication, buildContext({ config: { isProduction: true } }));

      expect(mockHelmet).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ hsts: { maxAge: 31_536_000, includeSubDomains: true, preload: true } }),
      );
    });
  });

  describe('auth reference CSP', () => {
    it('scopes the full permissive reference CSP to the auth reference path when swagger is enabled', () => {
      configureApplication(
        app as unknown as NestExpressApplication,
        buildContext({ security: { enableSwagger: true } }),
      );

      expect(expressApp.use).toHaveBeenCalledWith(AUTH_REFERENCE_PATH, expect.any(Function));
      expect(mockHelmet).toHaveBeenNthCalledWith(2, {
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
      });
    });

    it('does not register the CSP override when swagger is disabled', () => {
      configureApplication(
        app as unknown as NestExpressApplication,
        buildContext({ security: { enableSwagger: false } }),
      );

      expect(expressApp.use).not.toHaveBeenCalledWith(AUTH_REFERENCE_PATH, expect.anything());
      expect(mockHelmet).toHaveBeenCalledTimes(1);
    });
  });

  describe('cookies', () => {
    it('installs cookie-parser with the configured cookie secret', () => {
      const secret = 'b'.repeat(32);

      configureApplication(
        app as unknown as NestExpressApplication,
        buildContext({ security: { cookieSecret: secret } }),
      );

      expect(mockCookieParser).toHaveBeenCalledWith(secret);
      expect(app.use).toHaveBeenCalledWith(mockCookieParser.mock.results[0]?.value);
    });
  });

  describe('well-known assets', () => {
    it('serves static assets from the bootstrap public directory without an index or dotfile block', () => {
      configureApplication(app as unknown as NestExpressApplication, buildContext({}));

      expect(staticSpy).toHaveBeenCalledWith(expect.stringContaining('public'), {
        index: false,
        dotfiles: 'allow',
      });
      expect(expressApp.use).toHaveBeenCalledWith(staticSpy.mock.results[0]?.value);
    });
  });

  describe('CORS', () => {
    it('enables CORS with the configured origins and credentials when origins are configured', () => {
      configureApplication(
        app as unknown as NestExpressApplication,
        buildContext({ security: { corsOrigins: ['https://example.com'], corsCredentials: true } }),
      );

      expect(app.enableCors).toHaveBeenCalledWith({
        origin: ['https://example.com'],
        credentials: true,
        methods: ['GET', 'POST', 'PATCH', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id', 'X-Lang'],
        maxAge: 86_400,
      });
    });

    it('does not enable CORS when no origins are configured', () => {
      configureApplication(app as unknown as NestExpressApplication, buildContext({ security: { corsOrigins: [] } }));

      expect(app.enableCors).not.toHaveBeenCalled();
    });
  });

  describe('validation', () => {
    it('installs a strict global ValidationPipe with detailed errors outside production', () => {
      configureApplication(app as unknown as NestExpressApplication, buildContext({ config: { isProduction: false } }));

      expect(app.useGlobalPipes).toHaveBeenCalledTimes(1);

      const [pipe] = app.useGlobalPipes.mock.calls[0] as [
        {
          validatorOptions: { whitelist: boolean; forbidNonWhitelisted: boolean; forbidUnknownValues: boolean };
          isTransformEnabled: boolean;
          transformOptions: { enableImplicitConversion: boolean };
          isDetailedOutputDisabled: boolean;
        },
      ];

      expect(pipe.validatorOptions).toEqual(
        expect.objectContaining({ whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true }),
      );
      expect(pipe.isTransformEnabled).toBe(true);
      expect(pipe.transformOptions).toEqual({ enableImplicitConversion: false });
      expect(pipe.isDetailedOutputDisabled).toBe(false);
    });

    it('disables validation error message detail in production', () => {
      configureApplication(app as unknown as NestExpressApplication, buildContext({ config: { isProduction: true } }));

      const [pipe] = app.useGlobalPipes.mock.calls[0] as [{ isDetailedOutputDisabled: boolean }];

      expect(pipe.isDetailedOutputDisabled).toBe(true);
    });
  });

  describe('shutdown hooks', () => {
    it('enables shutdown hooks', () => {
      configureApplication(app as unknown as NestExpressApplication, buildContext({}));

      expect(app.enableShutdownHooks).toHaveBeenCalledTimes(1);
    });
  });
});
