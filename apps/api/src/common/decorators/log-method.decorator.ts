import { getRequestId, sanitizeArgs } from '@app/core/logging';
import { PinoLogger } from 'nestjs-pino';
import type { Logger } from 'pino';

export interface LogMethodOptions {
  redactArgs?: string[];
}

type AnyFn = (...args: unknown[]) => unknown;

function elapsedMs(startedAt: bigint): number {
  return Number(process.hrtime.bigint() - startedAt) / 1_000_000;
}

function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof value === 'object' && value !== null && typeof (value as { then?: unknown }).then === 'function';
}

/**
 * `PinoLogger.root` is nestjs-pino's own static handle to the base pino
 * instance, set once when `LoggingModule`'s `configure()` runs during
 * bootstrap — before any request (and so any decorated method call) can
 * happen. Read defensively anyway rather than throw: unlike the singleton
 * this replaces, a method decorator that can't log should never be able to
 * take the wrapped call down with it.
 */
function getRootLogger(): Logger | undefined {
  return PinoLogger.root;
}

export function LogMethod(options?: LogMethodOptions): MethodDecorator {
  return function decorate(
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor,
  ): PropertyDescriptor {
    const originalMethod = descriptor.value as AnyFn;
    const className = (target as { constructor: { name: string } }).constructor.name;
    const methodName = String(propertyKey);

    function onSuccess(startedAt: bigint, result: unknown): unknown {
      getRootLogger()?.debug({
        event: 'method.end',
        class: className,
        method: methodName,
        durationMs: elapsedMs(startedAt),
        requestId: getRequestId(),
      });

      return result;
    }

    function onError(startedAt: bigint, err: unknown): never {
      getRootLogger()?.error({
        event: 'method.error',
        class: className,
        method: methodName,
        durationMs: elapsedMs(startedAt),
        err,
        requestId: getRequestId(),
      });

      throw err;
    }

    function wrapped(this: unknown, ...args: unknown[]): unknown {
      const startedAt = process.hrtime.bigint();

      getRootLogger()?.debug({
        event: 'method.start',
        class: className,
        method: methodName,
        args: sanitizeArgs(args, options?.redactArgs),
        requestId: getRequestId(),
      });

      let result: unknown;

      try {
        result = originalMethod.apply(this, args);
      } catch (err) {
        onError(startedAt, err);
      }

      if (isThenable(result)) {
        return result.then(
          (value: unknown) => onSuccess(startedAt, value),
          (err: unknown) => onError(startedAt, err),
        );
      }

      return onSuccess(startedAt, result);
    }

    for (const metadataKey of Reflect.getMetadataKeys(originalMethod) as unknown[]) {
      Reflect.defineMetadata(metadataKey, Reflect.getMetadata(metadataKey, originalMethod), wrapped);
    }

    // eslint-disable-next-line no-param-reassign -- swapping in the wrapped implementation is the point of a method decorator.
    descriptor.value = wrapped;

    return descriptor;
  };
}
