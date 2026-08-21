import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Options, StdSerializedResults } from 'pino-http';
import {
  createPinoHttpOptions,
  isHealthCheckRequest,
  keepResponseStatusOnly,
  maskSensitiveQuery,
  maskSensitiveRequestFields,
} from '../strategies/pino-options.factory';

function pinoHttpOptionsOf(params: Parameters<typeof createPinoHttpOptions>[0]): Options {
  return createPinoHttpOptions(params).pinoHttp as Options;
}

function requestFor(url: string | undefined): IncomingMessage {
  return { url } as IncomingMessage;
}

describe('createPinoHttpOptions', () => {
  it('uses the given log level', () => {
    expect(pinoHttpOptionsOf({ logLevel: 'warn', logFormat: 'json' }).level).toBe('warn');
  });

  it('renames the automatic reqId binding to requestId for consistency with app logs', () => {
    expect(pinoHttpOptionsOf({ logLevel: 'info', logFormat: 'json' }).customAttributeKeys).toEqual({
      reqId: 'requestId',
    });
  });

  describe('transport', () => {
    it('pretty-prints with a concise, single-line shape when logFormat is pretty', () => {
      const options = pinoHttpOptionsOf({ logLevel: 'debug', logFormat: 'pretty' });

      expect(options.transport).toMatchObject({
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      });
    });

    it('leaves structured JSON output alone when logFormat is json', () => {
      expect(pinoHttpOptionsOf({ logLevel: 'info', logFormat: 'json' }).transport).toBeUndefined();
    });
  });

  describe('autoLogging.ignore', () => {
    it('ignores health-check routes', () => {
      const options = pinoHttpOptionsOf({ logLevel: 'info', logFormat: 'json' });
      const ignore = (options.autoLogging as { ignore: (req: IncomingMessage) => boolean }).ignore;

      expect(ignore(requestFor('/api/health/live'))).toBe(true);
      expect(ignore(requestFor('/api/health/ready?probe=1'))).toBe(true);
    });

    it('does not ignore other routes', () => {
      const options = pinoHttpOptionsOf({ logLevel: 'info', logFormat: 'json' });
      const ignore = (options.autoLogging as { ignore: (req: IncomingMessage) => boolean }).ignore;

      expect(ignore(requestFor('/api/auth/session'))).toBe(false);
    });
  });

  describe('customLogLevel', () => {
    const options = pinoHttpOptionsOf({ logLevel: 'info', logFormat: 'json' });
    const customLogLevel = options.customLogLevel as (req: IncomingMessage, res: ServerResponse, err?: Error) => string;

    it('logs 5xx responses as error', () => {
      expect(customLogLevel(requestFor('/'), { statusCode: 500 } as ServerResponse)).toBe('error');
    });

    it('logs an errored request as error regardless of status', () => {
      expect(customLogLevel(requestFor('/'), { statusCode: 200 } as ServerResponse, new Error('boom'))).toBe('error');
    });

    it('logs 4xx responses as warn', () => {
      expect(customLogLevel(requestFor('/'), { statusCode: 404 } as ServerResponse)).toBe('warn');
    });

    it('logs successful responses as info', () => {
      expect(customLogLevel(requestFor('/'), { statusCode: 200 } as ServerResponse)).toBe('info');
    });
  });
});

describe('maskSensitiveQuery', () => {
  it('returns the url untouched when there is no query string', () => {
    expect(maskSensitiveQuery('/api/health/live')).toBe('/api/health/live');
  });

  it('masks a better-auth GitHub OAuth code/state pair', () => {
    expect(maskSensitiveQuery('/api/auth/callback/github?code=abc123&state=xyz')).toBe(
      '/api/auth/callback/github?code=[REDACTED]&state=[REDACTED]',
    );
  });

  it('leaves non-sensitive query params untouched', () => {
    expect(maskSensitiveQuery('/api/health/ready?probe=1')).toBe('/api/health/ready?probe=1');
  });

  it('falls back to the raw name when percent-decoding fails', () => {
    expect(maskSensitiveQuery('/x?%E0%A4%A=1')).toBe('/x?%E0%A4%A=1');
  });
});

describe('maskSensitiveRequestFields', () => {
  it('keeps only id, method, masked url, and remoteAddress', () => {
    const serialized = {
      id: 'req-1',
      method: 'GET',
      url: '/api/auth/callback/github?code=abc',
      headers: { authorization: 'Bearer secret' },
      remoteAddress: '10.0.0.1',
      remotePort: 443,
      params: {},
      query: {},
      raw: undefined,
    } as unknown as StdSerializedResults['req'];

    expect(maskSensitiveRequestFields(serialized)).toEqual({
      id: 'req-1',
      method: 'GET',
      url: '/api/auth/callback/github?code=[REDACTED]',
      remoteAddress: '10.0.0.1',
    });
  });

  it('prefers the trust-proxy-resolved req.ip over the socket remoteAddress', () => {
    const serialized = {
      id: 'req-2',
      method: 'GET',
      url: '/',
      headers: {},
      remoteAddress: '10.0.0.1',
      remotePort: 443,
      params: {},
      query: {},
      raw: { ip: '203.0.113.5' },
    } as unknown as StdSerializedResults['req'];

    expect(maskSensitiveRequestFields(serialized).remoteAddress).toBe('203.0.113.5');
  });
});

describe('keepResponseStatusOnly', () => {
  it('keeps only statusCode, dropping headers', () => {
    const serialized = {
      statusCode: 204,
      headers: { 'set-cookie': 'a=b' },
      raw: undefined,
    } as unknown as StdSerializedResults['res'];

    expect(keepResponseStatusOnly(serialized)).toEqual({ statusCode: 204 });
  });
});

describe('isHealthCheckRequest', () => {
  it('matches health-check paths', () => {
    expect(isHealthCheckRequest(requestFor('/api/health/live'))).toBe(true);
  });

  it('does not match unrelated paths', () => {
    expect(isHealthCheckRequest(requestFor('/api/users'))).toBe(false);
  });

  it('treats a missing url as non-health-check', () => {
    expect(isHealthCheckRequest(requestFor(undefined))).toBe(false);
  });

  it('reads originalUrl when the wildcard middleware mount has relativized req.url to "/"', () => {
    // Reproduces the exact bug observed via a runtime smoke test: pino-http's
    // middleware is Nest-mounted on `*path`, and Express relativizes `req.url`
    // to "/" for the duration of a wildcard-mounted layer while `originalUrl`
    // still holds the real path. Asserting on `url` alone would have made this
    // predicate always return false in production.
    expect(isHealthCheckRequest({ originalUrl: '/api/health/live', url: '/' } as unknown as IncomingMessage)).toBe(
      true,
    );
    expect(isHealthCheckRequest({ originalUrl: '/api/other', url: '/' } as unknown as IncomingMessage)).toBe(false);
  });
});
