import { createHash, randomBytes } from 'node:crypto';

const TOKEN_PREFIX = 'wst_live_';
const PREFIX_SECRET_LENGTH = 8;

export interface GeneratedWebsiteToken {
  token: string;
  prefix: string;
  tokenHash: string;
}

export function generateWebsiteToken(): GeneratedWebsiteToken {
  const secret = randomBytes(32).toString('base64url');

  const token = `${TOKEN_PREFIX}${secret}`;

  const tokenHash = hashWebsiteToken(token);

  return {
    token,
    prefix: `${TOKEN_PREFIX}${secret.slice(0, PREFIX_SECRET_LENGTH)}`,
    tokenHash,
  };
}

export function hashWebsiteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
