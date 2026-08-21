import { requestContext } from '@app/core/logging/request-context';
import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import type { ReqId } from 'pino-http';

const REQUEST_ID_HEADER = 'x-request-id';
const MAX_REQUEST_ID_LENGTH = 64;

export function resolveRequestId(req: Pick<IncomingMessage, 'headers'> & { id?: ReqId }): string {
  if (typeof req.id === 'string' && req.id.length > 0) {
    return req.id;
  }

  const incoming = req.headers[REQUEST_ID_HEADER];

  return typeof incoming === 'string' && incoming.length > 0 && incoming.length <= MAX_REQUEST_ID_LENGTH
    ? incoming
    : randomUUID();
}

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  public use(req: Request, res: Response, next: NextFunction): void {
    const id = resolveRequestId(req);

    // eslint-disable-next-line no-param-reassign -- enriching the request object is the idiomatic way to attach data in Express/Nest middleware.
    req.id = id;
    res.setHeader(REQUEST_ID_HEADER, id);
    requestContext.run({ requestId: id }, () => {
      next();
    });
  }
}
