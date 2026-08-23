import { type CallHandler, type ExecutionContext, Injectable, type NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  DEFAULT_RESPONSE_MESSAGE,
  RESPONSE_MESSAGE_KEY,
  SKIP_RESPONSE_ENVELOPE_KEY,
} from '../constants/response.constants';
import type { ResponseEnvelope } from '../interfaces/response-envelope.interface';

@Injectable()
export class ResponseInterceptor implements NestInterceptor<unknown, unknown> {
  constructor(private readonly reflector: Reflector) {}

  public intercept(context: ExecutionContext, next: CallHandler<unknown>): Observable<unknown> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_RESPONSE_ENVELOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Exception filters get no handler/class context, so GlobalExceptionFilter reads this flag off the request.
    const request = context.switchToHttp().getRequest<Request>();
    request.skipResponseEnvelope = skip;

    if (skip) {
      return next.handle();
    }

    const message =
      this.reflector.getAllAndOverride<string | undefined>(RESPONSE_MESSAGE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? DEFAULT_RESPONSE_MESSAGE;

    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map(
        (data: unknown): ResponseEnvelope<unknown> => ({
          statusCode: response.statusCode,
          message,
          data: data ?? null,
        }),
      ),
    );
  }
}
