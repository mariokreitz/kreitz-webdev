import { getLogger } from '@app/core/logging/logger-registry';
import { getRequestId } from '@app/core/logging/request-context';
import { sanitizeArgs } from '@app/core/logging/sanitize';

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
      const logger = getLogger();

      logger.debug({
        event: 'method.end',
        class: className,
        method: methodName,
        durationMs: elapsedMs(startedAt),
        requestId: getRequestId(),
      });

      return result;
    }

    function onError(startedAt: bigint, err: unknown): never {
      const logger = getLogger();

      logger.error({
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
      const logger = getLogger();
      const startedAt = process.hrtime.bigint();

      logger.debug({
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
