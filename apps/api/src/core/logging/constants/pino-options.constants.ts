export const SERVICE_NAME = 'api';
export const PRETTY_TRANSPORT_TARGET = 'pino-pretty';
export const HEALTH_PATH_PREFIX = '/api/health';

// No endpoint declares a query param yet (zero `@Query()` usages) — add a name only when a real, non-sensitive one exists.
export const SAFE_QUERY_PARAMS = new Set<string>();
