import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { requestContext } from './request-context';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  public use(req: Request, res: Response, next: NextFunction): void {
    const incoming = req.headers['x-request-id'];
    const id = typeof incoming === 'string' && incoming.length <= 64 ? incoming : randomUUID();

    // eslint-disable-next-line no-param-reassign -- enriching the request object is the idiomatic way to attach data in Express/Nest middleware.
    req.id = id;
    res.setHeader('x-request-id', id);
    requestContext.run({ requestId: id }, () => {
      next();
    });
  }
}
