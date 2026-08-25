import { randomBytes } from 'node:crypto';

export function generateVerificationToken(): string {
  return randomBytes(32).toString('base64url');
}
