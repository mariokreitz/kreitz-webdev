import { hostname } from 'node:os';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { ReqId } from 'pino-http';

export interface CreatePinoHttpOptionsParams {
  isProduction: boolean;
  logLevel: string;
}

export interface PinoHttpConfig {
  level: string;
  base: Record<string, unknown>;
  transport?: { target: string; options: Record<string, unknown> };
  genReqId: (req: IncomingMessage) => ReqId;
  customLogLevel: (req: IncomingMessage, res: ServerResponse, err?: Error) => 'error' | 'warn' | 'info';
  customProps: (req: IncomingMessage) => Record<string, unknown>;
  redact: { paths: string[]; censor: string };
  wrapSerializers: false;
  serializers: {
    req: (req: IncomingMessage) => Record<string, unknown>;
    res: (res: ServerResponse) => Record<string, unknown>;
  };
}

const REDACT_PATHS: string[] = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.headers["x-api-key"]',
  'res.headers["set-cookie"]',
  'req.body.password',
  'req.body.token',
  'req.body.secret',
  'req.body.refreshToken',
  'req.body.accessToken',
];

const REDACT_CENSOR = '[REDACTED]';

export function createPinoHttpOptions({ isProduction, logLevel }: CreatePinoHttpOptionsParams): PinoHttpConfig {
  return {
    level: logLevel,
    base: { pid: process.pid, hostname: hostname(), service: 'api' },
    ...(isProduction
      ? {}
      : {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          },
        }),
    genReqId: (req: IncomingMessage): ReqId => req.id,
    customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error): 'error' | 'warn' | 'info' => {
      if (err || res.statusCode >= 500) {
        return 'error';
      }

      if (res.statusCode >= 400) {
        return 'warn';
      }

      return 'info';
    },
    customProps: (req: IncomingMessage): Record<string, unknown> => ({
      requestId: req.id,
    }),
    redact: {
      paths: REDACT_PATHS,
      censor: REDACT_CENSOR,
    },
    wrapSerializers: false,
    serializers: {
      req: (req: IncomingMessage) => ({
        method: req.method,
        url: req.url,
        headers: req.headers,
      }),
      res: (res: ServerResponse) => ({
        statusCode: res.statusCode,
        headers: res.getHeaders(),
      }),
    },
  };
}
