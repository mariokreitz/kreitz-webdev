import type { Request, Response } from 'express';
import { requestContext } from '../request-context';
import { RequestIdMiddleware, resolveRequestId } from '../request-id.middleware';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

describe('resolveRequestId', () => {
  it('reuses req.id when it is already set (e.g. by pino-http running first)', () => {
    expect(resolveRequestId({ headers: {}, id: 'already-set' })).toBe('already-set');
  });

  it('falls back to the incoming x-request-id header when req.id is unset', () => {
    expect(resolveRequestId({ headers: { 'x-request-id': 'from-header' } })).toBe('from-header');
  });

  it('mints a fresh uuid when neither req.id nor the header is present', () => {
    expect(resolveRequestId({ headers: {} })).toMatch(UUID_PATTERN);
  });

  it('mints a fresh uuid when the incoming header exceeds the length limit', () => {
    const tooLong = 'x'.repeat(65);

    expect(resolveRequestId({ headers: { 'x-request-id': tooLong } })).toMatch(UUID_PATTERN);
  });

  it('mints a fresh uuid when the incoming header is empty', () => {
    expect(resolveRequestId({ headers: { 'x-request-id': '' } })).toMatch(UUID_PATTERN);
  });

  it('ignores a non-string req.id (e.g. pino-http default numeric ids)', () => {
    expect(resolveRequestId({ headers: { 'x-request-id': 'from-header' }, id: 42 })).toBe('from-header');
  });
});

describe('RequestIdMiddleware', () => {
  function buildRequest(headers: Record<string, string> = {}): Request {
    return { headers } as unknown as Request;
  }

  function buildResponse(): Response & { setHeader: jest.Mock } {
    return { setHeader: jest.fn() } as unknown as Response & { setHeader: jest.Mock };
  }

  it('echoes the resolved id as the x-request-id response header', () => {
    const middleware = new RequestIdMiddleware();
    const req = buildRequest({ 'x-request-id': 'incoming-id' });
    const res = buildResponse();
    const next = jest.fn();

    middleware.use(req, res, next);

    expect(req.id).toBe('incoming-id');
    expect(res.setHeader).toHaveBeenCalledWith('x-request-id', 'incoming-id');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('runs next() inside the request-context ALS store carrying the same id', () => {
    const middleware = new RequestIdMiddleware();
    const req = buildRequest({ 'x-request-id': 'ctx-id' });
    const res = buildResponse();
    let observedRequestId: string | undefined;

    middleware.use(req, res, () => {
      observedRequestId = requestContext.getStore()?.requestId;
    });

    expect(observedRequestId).toBe('ctx-id');
  });
});
