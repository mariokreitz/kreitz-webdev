import type { AppConfig } from '@app/config';
import type { ArcjetDecision, ArcjetNest } from '@arcjet/nest';
import { HttpException, HttpStatus, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { PinoLogger } from 'nestjs-pino';

import { ArcjetRateLimitGuard } from '../arcjet-rate-limit.guard';

jest.mock('@arcjet/nest', () => ({
  ARCJET: Symbol('ARCJET'),
  tokenBucket: jest.fn((config: unknown) => config),
}));

function buildRequest(overrides: Record<string, unknown> = {}): Request {
  return {
    headers: {},
    ...overrides,
  } as unknown as Request;
}

function buildContext(request: Request): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
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

interface MockedPinoLogger {
  setContext: jest.Mock;
  trace: jest.Mock;
  debug: jest.Mock;
  info: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
  fatal: jest.Mock;
  assign: jest.Mock;
}

function buildLogger(): MockedPinoLogger {
  return {
    setContext: jest.fn(),
    trace: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    fatal: jest.fn(),
    assign: jest.fn(),
  };
}

function buildGuard(protectImpl: jest.Mock): { guard: ArcjetRateLimitGuard; logger: MockedPinoLogger } {
  const bucket = { protect: protectImpl };
  const arcjet = { withRule: jest.fn().mockReturnValue(bucket) } as unknown as ArcjetNest;
  const appConfig = { env: 'test' } as unknown as AppConfig;
  const logger = buildLogger();

  return { guard: new ArcjetRateLimitGuard(arcjet, appConfig, logger as unknown as PinoLogger), logger };
}

describe('ArcjetRateLimitGuard', () => {
  it('allows the request when Arcjet returns an allow decision', async () => {
    const protectMock = jest.fn().mockResolvedValue(buildDecision());
    const { guard } = buildGuard(protectMock);
    const context = buildContext(buildRequest());

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('throws a 429 HttpException when Arcjet denies the request for exceeding the rate limit', async () => {
    const protectMock = jest.fn().mockResolvedValue(buildDecision({ denied: true, rateLimit: true }));
    const { guard, logger } = buildGuard(protectMock);
    const context = buildContext(buildRequest({ websiteId: 'website-a' }));

    let thrown: unknown;

    try {
      await guard.canActivate(context);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'website_token.rate_limit.denied',
        bucket: 'website',
        websiteId: 'website-a',
      }),
    );
  });

  it('logs the ip_fallback bucket when a rate-limited request has no websiteId', async () => {
    const protectMock = jest.fn().mockResolvedValue(buildDecision({ denied: true, rateLimit: true }));
    const { guard, logger } = buildGuard(protectMock);
    const context = buildContext(buildRequest());

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(HttpException);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'website_token.rate_limit.denied',
        bucket: 'ip_fallback',
        websiteId: undefined,
      }),
    );
  });

  it('fails open and allows the request when the Arcjet client throws', async () => {
    const protectMock = jest.fn().mockRejectedValue(new Error('arcjet unreachable'));
    const { guard } = buildGuard(protectMock);
    const context = buildContext(buildRequest());

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
