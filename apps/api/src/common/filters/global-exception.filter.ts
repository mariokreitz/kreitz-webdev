import { Catch, HttpException, HttpStatus, type ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Request, Response } from 'express';
import { DEFAULT_ERROR_MESSAGE } from '../constants/response.constants';
import type { ResponseEnvelope } from '../interfaces/response-envelope.interface';

function hasMessage(body: unknown): body is { message: string | string[] } {
  if (typeof body !== 'object' || body === null || !('message' in body)) {
    return false;
  }

  const { message } = body;

  return typeof message === 'string' || (Array.isArray(message) && message.every((item) => typeof item === 'string'));
}

function extractMessage(exception: HttpException): string | string[] {
  const body = exception.getResponse();

  if (typeof body === 'string') {
    return body;
  }

  if (hasMessage(body)) {
    return body.message;
  }

  return exception.message;
}

@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
  public override catch(exception: unknown, host: ArgumentsHost): void {
    const request = host.switchToHttp().getRequest<Request>();

    if (request.skipResponseEnvelope) {
      super.catch(exception, host);
      return;
    }

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = exception instanceof HttpException ? extractMessage(exception) : DEFAULT_ERROR_MESSAGE;

    const body: ResponseEnvelope<null> = { statusCode: status, message, data: null };

    const response = host.switchToHttp().getResponse<Response>();

    response.status(status).json(body);
  }
}
