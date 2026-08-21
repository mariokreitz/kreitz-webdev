import { resolveRequestId } from '@app/core/logging/middlewares/request-id.middleware';
import type { Request } from 'express';
import type { Params } from 'nestjs-pino';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { hostname } from 'node:os';
import type { StdSerializedResults } from 'pino-http';
import { REDACTED } from '../constants/logging.constants';
import {
  HEALTH_PATH_PREFIX,
  PRETTY_TRANSPORT_TARGET,
  SENSITIVE_QUERY_PARAMS,
  SERVICE_NAME,
} from '../constants/pino-options.constants';
import type { CreatePinoHttpOptionsParams, LoggedRequest, LoggedResponse } from '../interfaces/pino-options.interface';

function decodeParamName(name: string): string {
  try {
    return decodeURIComponent(name.replace(/\+/g, ' '));
  } catch {
    return name;
  }
}

export function maskSensitiveQuery(url: string): string {
  const separator = url.indexOf('?');

  if (separator === -1) {
    return url;
  }

  const query = url
    .slice(separator + 1)
    .split('&')
    .map((pair) => {
      const equals = pair.indexOf('=');
      const name = equals === -1 ? pair : pair.slice(0, equals);

      return SENSITIVE_QUERY_PARAMS.has(decodeParamName(name).toLowerCase()) ? `${name}=${REDACTED}` : pair;
    })
    .join('&');

  return `${url.slice(0, separator)}?${query}`;
}

export function maskSensitiveRequestFields(req: StdSerializedResults['req']): LoggedRequest {
  const raw = req.raw as Request | undefined;

  return {
    id: req.id,
    method: req.method,
    url: typeof req.url === 'string' ? maskSensitiveQuery(req.url) : req.url,
    remoteAddress: raw?.ip ?? req.remoteAddress,
  };
}

export function keepResponseStatusOnly(res: StdSerializedResults['res']): LoggedResponse {
  return { statusCode: res.statusCode };
}

export function isHealthCheckRequest(req: IncomingMessage): boolean {
  const path = (req as Partial<Request>).originalUrl ?? req.url ?? '';

  return path.split('?')[0]?.startsWith(HEALTH_PATH_PREFIX) ?? false;
}

export function createPinoHttpOptions({ logLevel, logFormat }: CreatePinoHttpOptionsParams): Params {
  return {
    pinoHttp: {
      level: logLevel,
      base: { pid: process.pid, hostname: hostname(), service: SERVICE_NAME },
      genReqId: (req: IncomingMessage): string => resolveRequestId(req),
      customAttributeKeys: { reqId: 'requestId' },
      quietReqLogger: true,
      customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error): 'error' | 'warn' | 'info' => {
        if (err || res.statusCode >= 500) {
          return 'error';
        }

        if (res.statusCode >= 400) {
          return 'warn';
        }

        return 'info';
      },
      serializers: {
        req: maskSensitiveRequestFields,
        res: keepResponseStatusOnly,
      },
      autoLogging: { ignore: isHealthCheckRequest },
      ...(logFormat === 'pretty'
        ? {
            transport: {
              target: PRETTY_TRANSPORT_TARGET,
              options: {
                colorize: true,
                singleLine: true,
                translateTime: 'SYS:HH:MM:ss.l',
                ignore: 'pid,hostname',
              },
            },
          }
        : {}),
    },
    forRoutes: ['*path'],
  };
}
