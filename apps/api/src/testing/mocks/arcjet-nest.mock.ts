export const ARCJET: unique symbol = Symbol('ARCJET');

export function tokenBucket<T>(config: T): T {
  return config;
}

export function detectBot<T>(config: T): T {
  return config;
}

export function validateEmail<T>(config: T): T {
  return config;
}

export function shield<T>(config: T): T {
  return config;
}

export const ArcjetModule = {
  forRootAsync: (): { module: unknown; providers: unknown[] } => ({ module: ArcjetModule, providers: [] }),
};
