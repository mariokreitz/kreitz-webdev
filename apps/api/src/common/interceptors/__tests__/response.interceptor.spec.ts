import type { CallHandler, ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { of } from 'rxjs';
import { SKIP_RESPONSE_ENVELOPE_KEY } from '../../constants/response.constants';
import { ResponseInterceptor } from '../response.interceptor';

function buildContext(statusCode: number): { context: ExecutionContext; request: Request } {
  const response = { statusCode } as Response;
  const request = {} as Request;

  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue(response),
      getRequest: jest.fn().mockReturnValue(request),
    }),
  } as unknown as ExecutionContext;

  return { context, request };
}

function buildCallHandler<T>(value: T): CallHandler<T> {
  return { handle: jest.fn().mockReturnValue(of(value)) };
}

function buildReflector(overrides: Partial<Record<string, unknown>> = {}): {
  reflector: Reflector;
  getAllAndOverride: jest.Mock;
} {
  const getAllAndOverride = jest.fn((key: string) => overrides[key]);

  return { reflector: { getAllAndOverride } as unknown as Reflector, getAllAndOverride };
}

describe('ResponseInterceptor', () => {
  it('wraps the response body with the default message when none is set', (done) => {
    const { reflector } = buildReflector();
    const interceptor = new ResponseInterceptor(reflector);
    const { context } = buildContext(200);
    const next = buildCallHandler({ id: 'a' });

    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual({ statusCode: 200, message: 'Success', data: { id: 'a' } });
      done();
    });
  });

  it('uses the message from @ResponseMessage when present', (done) => {
    const { reflector } = buildReflector({ response_message: 'Project created' });
    const interceptor = new ResponseInterceptor(reflector);
    const { context } = buildContext(201);
    const next = buildCallHandler({ id: 'b' });

    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual({ statusCode: 201, message: 'Project created', data: { id: 'b' } });
      done();
    });
  });

  it('passes through the actual HTTP status code set by Nest (e.g. 201 on POST)', (done) => {
    const { reflector } = buildReflector();
    const interceptor = new ResponseInterceptor(reflector);
    const { context } = buildContext(204);
    const next = buildCallHandler({ id: 'c' });

    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual({ statusCode: 204, message: 'Success', data: { id: 'c' } });
      done();
    });
  });

  it('normalizes an undefined handler result (e.g. a void DELETE) to data: null', (done) => {
    const { reflector } = buildReflector();
    const interceptor = new ResponseInterceptor(reflector);
    const { context } = buildContext(200);
    const next = buildCallHandler(undefined);

    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual({ statusCode: 200, message: 'Success', data: null });
      done();
    });
  });

  it('skips wrapping entirely when @SkipResponseEnvelope is set', (done) => {
    const { reflector } = buildReflector({ [SKIP_RESPONSE_ENVELOPE_KEY]: true });
    const interceptor = new ResponseInterceptor(reflector);
    const { context } = buildContext(200);
    const next = buildCallHandler({ status: 'ok' });

    interceptor.intercept(context, next).subscribe((result) => {
      expect(result).toEqual({ status: 'ok' });
      done();
    });
  });

  it('stashes skipResponseEnvelope: true on the request for GlobalExceptionFilter to read', () => {
    const { reflector } = buildReflector({ [SKIP_RESPONSE_ENVELOPE_KEY]: true });
    const interceptor = new ResponseInterceptor(reflector);
    const { context, request } = buildContext(200);
    const next = buildCallHandler({ status: 'ok' });

    interceptor.intercept(context, next);

    expect(request.skipResponseEnvelope).toBe(true);
  });

  it('stashes a falsy skipResponseEnvelope on the request when not skipped', () => {
    const { reflector } = buildReflector();
    const interceptor = new ResponseInterceptor(reflector);
    const { context, request } = buildContext(200);
    const next = buildCallHandler({ id: 'a' });

    interceptor.intercept(context, next);

    expect(request.skipResponseEnvelope).toBeFalsy();
  });

  it('honors class-level metadata via getAllAndOverride', () => {
    const { reflector, getAllAndOverride } = buildReflector();
    const interceptor = new ResponseInterceptor(reflector);
    const { context } = buildContext(200);
    const next = buildCallHandler({});

    interceptor.intercept(context, next);

    expect(getAllAndOverride).toHaveBeenCalledWith(SKIP_RESPONSE_ENVELOPE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
  });
});
