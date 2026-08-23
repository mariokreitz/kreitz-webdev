import type { WebsiteTokenRecord } from '@app/database/types/website-token.types';
import type { WebsiteTokenSummaryResponse } from '@app/modules/website-token/dto/website-token-summary.response';
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

export function toWebsiteTokenSummary(token: WebsiteTokenRecord): WebsiteTokenSummaryResponse {
  return {
    id: token.id,
    websiteId: token.websiteId,
    name: token.name,
    prefix: token.prefix,
    expiresAt: token.expiresAt,
    lastUsedAt: token.lastUsedAt,
    createdAt: token.createdAt,
    updatedAt: token.updatedAt,
  };
}
