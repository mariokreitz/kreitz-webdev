import { randomBytes } from 'node:crypto';

export const AUTH_REFERENCE_PATH = '/api/auth/reference';

export const AUTH_REFERENCE_CSP_NONCE = randomBytes(16).toString('base64');
