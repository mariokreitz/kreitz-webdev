import type { Logger } from 'pino';

let instance: Logger | undefined;

export function setLogger(logger: Logger): void {
  instance = logger;
}

export function getLogger(): Logger {
  if (!instance) {
    throw new Error('Logger not initialized: setLogger() must run before getLogger() is called.');
  }

  return instance;
}
