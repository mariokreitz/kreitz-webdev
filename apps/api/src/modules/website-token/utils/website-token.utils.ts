import { createHash, randomBytes } from 'node:crypto';

const TOKEN_PREFIX = 'wst_live_';

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
    prefix: token.slice(0, TOKEN_PREFIX.length),
    tokenHash,
  };
}

export function hashWebsiteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
