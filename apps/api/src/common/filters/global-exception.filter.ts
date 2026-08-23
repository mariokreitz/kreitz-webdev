import { Catch, HttpException, HttpStatus, type ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Request, Response } from 'express';
import { DEFAULT_ERROR_MESSAGE } from '../constants/response.constants';
import type { ResponseEnvelope } from '../interfaces/response-envelope.interface';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractMessage(exception: HttpException): string | string[] {
  const body = exception.getResponse();

  if (typeof body === 'string') {
    return body;
  }

  if (isRecord(body) && (typeof body['message'] === 'string' || Array.isArray(body['message']))) {
    return body['message'] as string | string[];
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
