import { AsyncLocalStorage } from 'node:async_hooks';
import type { RequestContextStore } from './interfaces/request-context.interface';

export const requestContext = new AsyncLocalStorage<RequestContextStore>();

export function getRequestId(): string | undefined {
  return requestContext.getStore()?.requestId;
}
