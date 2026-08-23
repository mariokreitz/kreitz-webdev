import type { AppConfig } from '@app/config';
import type { ArcjetDecision, ArcjetNest } from '@arcjet/nest';
import type { NextFunction, Request, Response } from 'express';
import type { PinoLogger } from 'nestjs-pino';

jest.mock('@arcjet/nest', () => ({
  ARCJET: Symbol('ARCJET'),
  detectBot: jest.fn((config: unknown) => config),
  tokenBucket: jest.fn((config: unknown) => config),
  validateEmail: jest.fn((config: unknown) => config),
}));

const mockJsonBodyParser = jest.fn((_req: Request, _res: Response, callback: (error?: unknown) => void): void => {
  callback();
});

jest.mock('express', () => ({
  json: jest.fn(() => mockJsonBodyParser),
}));

import { ArcjetAuthMiddleware } from '../arcjet-auth.middleware';

interface MockedLogger {
  setContext: jest.Mock;
  error: jest.Mock;
  info: jest.Mock;
  debug: jest.Mock;
}

function buildLogger(): MockedLogger {
  return {
    setContext: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
  };
}

interface MockedArcjetBucket {
  withRule: jest.Mock;
  protect: jest.Mock;
}

function buildArcjet(protectImpl: jest.Mock): ArcjetNest {
  const bucket = {} as MockedArcjetBucket;

  bucket.withRule = jest.fn().mockReturnValue(bucket);
  bucket.protect = protectImpl;

  return {
    withRule: jest.fn().mockReturnValue(bucket),
    protect: protectImpl,
  } as ArcjetNest;
}

function buildMiddleware(protectImpl: jest.Mock): { middleware: ArcjetAuthMiddleware; logger: MockedLogger } {
  const arcjet = buildArcjet(protectImpl);
  const app = { env: 'test' } as unknown as AppConfig;
  const logger = buildLogger();

  return {
    middleware: new ArcjetAuthMiddleware(arcjet, app, logger as unknown as PinoLogger),
    logger,
  };
}

function buildRequest(overrides: Record<string, unknown> = {}): Request {
  return {
    path: '/api/auth/sign-out',
    headers: {},
    ...overrides,
  } as unknown as Request;
}

function buildResponse(): { res: Response; status: jest.Mock; json: jest.Mock } {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });

  return { res: { status } as unknown as Response, status, json };
}

function buildDecision(overrides: { denied?: boolean; rateLimit?: boolean; errored?: boolean } = {}): ArcjetDecision {
  return {
    isDenied: () => overrides.denied ?? false,
    isErrored: () => overrides.errored ?? false,
    reason: {
      isRateLimit: () => overrides.rateLimit ?? false,
      message: 'mock arcjet reason',
    },
  } as unknown as ArcjetDecision;
}

describe('ArcjetAuthMiddleware', () => {
  beforeEach(() => {
    mockJsonBodyParser.mockClear();
    mockJsonBodyParser.mockImplementation((_req: Request, _res: Response, callback: (error?: unknown) => void) => {
      callback();
    });
  });

  it('passes through to next() without calling Arcjet when the path is outside /api/auth', async () => {
    const protectImpl = jest.fn();
    const { middleware } = buildMiddleware(protectImpl);
    const req = buildRequest({ path: '/api/projects' });
    const { res } = buildResponse();
    const next: NextFunction = jest.fn();

    await middleware.use(req, res, next);

    expect(protectImpl).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('calls next() on an allow decision for a generic /api/auth route', async () => {
    const protectImpl = jest.fn<Promise<ArcjetDecision>, [Request]>().mockResolvedValue(buildDecision());
    const { middleware } = buildMiddleware(protectImpl);
    const req = buildRequest();
    const { res, status } = buildResponse();
    const next: NextFunction = jest.fn();

    await middleware.use(req, res, next);

    expect(protectImpl).toHaveBeenCalledWith(req);
    expect(protectImpl.mock.calls[0]?.[0]).toBe(req);
    expect(next).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
  });

  it('responds 403 with "Request blocked" when the decision is denied for a non-rate-limit reason', async () => {
    const protectImpl = jest.fn().mockResolvedValue(buildDecision({ denied: true, rateLimit: false }));
    const { middleware } = buildMiddleware(protectImpl);
    const req = buildRequest();
    const { res, status, json } = buildResponse();
    const next: NextFunction = jest.fn();

    await middleware.use(req, res, next);

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({ message: 'Request blocked' });
    expect(next).not.toHaveBeenCalled();
  });

  it('responds 429 when the decision is denied for exceeding the rate limit', async () => {
    const protectImpl = jest.fn().mockResolvedValue(buildDecision({ denied: true, rateLimit: true }));
    const { middleware } = buildMiddleware(protectImpl);
    const req = buildRequest();
    const { res, status, json } = buildResponse();
    const next: NextFunction = jest.fn();

    await middleware.use(req, res, next);

    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith({ message: 'Request blocked' });
    expect(next).not.toHaveBeenCalled();
  });

  it('logs and still calls next() when the decision is errored but not denied', async () => {
    const protectImpl = jest.fn().mockResolvedValue(buildDecision({ errored: true }));
    const { middleware, logger } = buildMiddleware(protectImpl);
    const req = buildRequest();
    const { res, status } = buildResponse();
    const next: NextFunction = jest.fn();

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledTimes(1);
  });

  it('fails open and calls next() when the underlying Arcjet call throws', async () => {
    const protectImpl = jest.fn().mockRejectedValue(new Error('arcjet unreachable'));
    const { middleware, logger } = buildMiddleware(protectImpl);
    const req = buildRequest();
    const { res, status } = buildResponse();
    const next: NextFunction = jest.fn();

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledTimes(1);
  });

  it('fails open and calls next() when the underlying Arcjet call rejects with a non-Error value', async () => {
    const protectImpl = jest.fn().mockRejectedValue('arcjet exploded');
    const { middleware } = buildMiddleware(protectImpl);
    const req = buildRequest();
    const { res, status } = buildResponse();
    const next: NextFunction = jest.fn();

    await middleware.use(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(status).not.toHaveBeenCalled();
  });

  it('extracts the email from a JSON body and passes it to protect() on the sign-up-with-email path', async () => {
    const protectImpl = jest.fn().mockResolvedValue(buildDecision());
    const { middleware } = buildMiddleware(protectImpl);
    const req = buildRequest({
      path: '/api/auth/sign-up/email',
      headers: { 'content-type': 'application/json' },
      body: { email: 'user@example.com', password: 'secret' },
    });
    const { res } = buildResponse();
    const next: NextFunction = jest.fn();

    await middleware.use(req, res, next);

    expect(mockJsonBodyParser).toHaveBeenCalledTimes(1);
    expect(protectImpl).toHaveBeenCalledWith(req, { requested: 1, email: 'user@example.com' });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('skips email extraction and uses the base bucket when content-type is not JSON on sign-up', async () => {
    const protectImpl = jest.fn().mockResolvedValue(buildDecision());
    const { middleware } = buildMiddleware(protectImpl);
    const req = buildRequest({
      path: '/api/auth/sign-up/email',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: { email: 'user@example.com' },
    });
    const { res } = buildResponse();
    const next: NextFunction = jest.fn();

    await middleware.use(req, res, next);

    expect(mockJsonBodyParser).not.toHaveBeenCalled();
    expect(protectImpl).toHaveBeenCalledWith(req, { requested: 1 });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('uses the base bucket when the JSON body has no email field', async () => {
    const protectImpl = jest.fn().mockResolvedValue(buildDecision());
    const { middleware } = buildMiddleware(protectImpl);
    const req = buildRequest({
      path: '/api/auth/sign-up/email',
      headers: { 'content-type': 'application/json' },
      body: { password: 'secret' },
    });
    const { res } = buildResponse();
    const next: NextFunction = jest.fn();

    await middleware.use(req, res, next);

    expect(protectImpl).toHaveBeenCalledWith(req, { requested: 1 });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('still proceeds on the base bucket when the JSON pre-parse fails', async () => {
    mockJsonBodyParser.mockImplementation((_req: Request, _res: Response, callback: (error?: unknown) => void) => {
      callback(new Error('body too large'));
    });

    const protectImpl = jest.fn().mockResolvedValue(buildDecision());
    const { middleware, logger } = buildMiddleware(protectImpl);
    const req = buildRequest({
      path: '/api/auth/sign-up/email',
      headers: { 'content-type': 'application/json' },
    });
    const { res } = buildResponse();
    const next: NextFunction = jest.fn();

    await middleware.use(req, res, next);

    expect(protectImpl).toHaveBeenCalledWith(req, { requested: 1 });
    expect(next).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledTimes(1);
  });

  it('still proceeds on the base bucket when the JSON pre-parse fails with a non-Error value', async () => {
    mockJsonBodyParser.mockImplementation((_req: Request, _res: Response, callback: (error?: unknown) => void) => {
      callback('body too large');
    });

    const protectImpl = jest.fn().mockResolvedValue(buildDecision());
    const { middleware, logger } = buildMiddleware(protectImpl);
    const req = buildRequest({
      path: '/api/auth/sign-up/email',
      headers: { 'content-type': 'application/json' },
    });
    const { res } = buildResponse();
    const next: NextFunction = jest.fn();

    await middleware.use(req, res, next);

    expect(protectImpl).toHaveBeenCalledWith(req, { requested: 1 });
    expect(next).toHaveBeenCalledTimes(1);
    expect(logger.debug).toHaveBeenCalledTimes(1);
  });

  it('calls protect() with a fixed request budget on the sign-in path', async () => {
    const protectImpl = jest.fn().mockResolvedValue(buildDecision());
    const { middleware } = buildMiddleware(protectImpl);
    const req = buildRequest({ path: '/api/auth/sign-in/email' });
    const { res } = buildResponse();
    const next: NextFunction = jest.fn();

    await middleware.use(req, res, next);

    expect(protectImpl).toHaveBeenCalledWith(req, { requested: 1 });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('denies the sign-in path the same way as the generic path', async () => {
    const protectImpl = jest.fn().mockResolvedValue(buildDecision({ denied: true, rateLimit: true }));
    const { middleware } = buildMiddleware(protectImpl);
    const req = buildRequest({ path: '/api/auth/sign-in/email' });
    const { res, status, json } = buildResponse();
    const next: NextFunction = jest.fn();

    await middleware.use(req, res, next);

    expect(status).toHaveBeenCalledWith(429);
    expect(json).toHaveBeenCalledWith({ message: 'Request blocked' });
    expect(next).not.toHaveBeenCalled();
  });
});
