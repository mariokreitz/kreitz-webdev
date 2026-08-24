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

interface MockBucket {
  protect: jest.Mock;
}

interface MockBuckets {
  website: MockBucket;
  user: MockBucket;
  ipFallback: MockBucket;
}

function buildBuckets(): MockBuckets {
  return {
    website: { protect: jest.fn() },
    user: { protect: jest.fn() },
    ipFallback: { protect: jest.fn() },
  };
}

function buildGuard(buckets: MockBuckets): { guard: ArcjetRateLimitGuard; logger: MockedPinoLogger } {
  const withRule = jest.fn((config: { characteristics?: string[] }) => {
    if (config.characteristics?.includes('websiteId')) {
      return buckets.website;
    }

    if (config.characteristics?.includes('userId')) {
      return buckets.user;
    }

    return buckets.ipFallback;
  });
  const arcjet = { withRule } as unknown as ArcjetNest;
  const appConfig = { env: 'test' } as unknown as AppConfig;
  const logger = buildLogger();

  return { guard: new ArcjetRateLimitGuard(arcjet, appConfig, logger as unknown as PinoLogger), logger };
}

describe('ArcjetRateLimitGuard', () => {
  it('allows the request when Arcjet returns an allow decision', async () => {
    const buckets = buildBuckets();
    buckets.ipFallback.protect.mockResolvedValue(buildDecision());
    const { guard } = buildGuard(buckets);
    const context = buildContext(buildRequest());

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('protects using the website bucket and throws a 429 when it denies for exceeding the rate limit', async () => {
    const buckets = buildBuckets();
    buckets.website.protect.mockResolvedValue(buildDecision({ denied: true, rateLimit: true }));
    const { guard, logger } = buildGuard(buckets);
    const context = buildContext(buildRequest({ websiteId: 'website-a' }));

    let thrown: unknown;

    try {
      await guard.canActivate(context);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(HttpException);
    expect((thrown as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(buckets.website.protect).toHaveBeenCalledWith(expect.anything(), { requested: 1, websiteId: 'website-a' });
    expect(buckets.user.protect).not.toHaveBeenCalled();
    expect(buckets.ipFallback.protect).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'arcjet.rate_limit.denied',
        bucket: 'website',
        websiteId: 'website-a',
      }),
    );
  });

  it('protects using the ip fallback bucket when a request has no websiteId or session', async () => {
    const buckets = buildBuckets();
    buckets.ipFallback.protect.mockResolvedValue(buildDecision({ denied: true, rateLimit: true }));
    const { guard, logger } = buildGuard(buckets);
    const context = buildContext(buildRequest());

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(HttpException);
    expect(buckets.ipFallback.protect).toHaveBeenCalledWith(expect.anything(), { requested: 1 });
    expect(buckets.website.protect).not.toHaveBeenCalled();
    expect(buckets.user.protect).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'arcjet.rate_limit.denied',
        bucket: 'ip_fallback',
        websiteId: undefined,
        userId: undefined,
      }),
    );
  });

  it('protects using the user bucket when a request carries a session but no websiteId', async () => {
    const buckets = buildBuckets();
    buckets.user.protect.mockResolvedValue(buildDecision({ denied: true, rateLimit: true }));
    const { guard, logger } = buildGuard(buckets);
    const context = buildContext(buildRequest({ session: { user: { id: 'user-a' } } }));

    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(HttpException);
    expect(buckets.user.protect).toHaveBeenCalledWith(expect.anything(), { requested: 1, userId: 'user-a' });
    expect(buckets.website.protect).not.toHaveBeenCalled();
    expect(buckets.ipFallback.protect).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'arcjet.rate_limit.denied',
        bucket: 'user',
        websiteId: undefined,
        userId: 'user-a',
      }),
    );
  });

  it('prefers the website bucket over the user bucket when a request carries both', async () => {
    const buckets = buildBuckets();
    buckets.website.protect.mockResolvedValue(buildDecision());
    const { guard } = buildGuard(buckets);
    const context = buildContext(buildRequest({ websiteId: 'website-a', session: { user: { id: 'user-a' } } }));

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(buckets.website.protect).toHaveBeenCalledWith(expect.anything(), { requested: 1, websiteId: 'website-a' });
    expect(buckets.user.protect).not.toHaveBeenCalled();
  });

  it('fails open and allows the request when the Arcjet client throws', async () => {
    const buckets = buildBuckets();
    buckets.ipFallback.protect.mockRejectedValue(new Error('arcjet unreachable'));
    const { guard } = buildGuard(buckets);
    const context = buildContext(buildRequest());

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });
});
