export const SERVICE_NAME = 'api';
export const PRETTY_TRANSPORT_TARGET = 'pino-pretty';
export const HEALTH_PATH_PREFIX = '/api/health';

export const SENSITIVE_QUERY_PARAMS = new Set([
  'token',
  'access_token',
  'refresh_token',
  'api_key',
  'apikey',
  'secret',
  'signature',
  'code',
  'state',
]);
