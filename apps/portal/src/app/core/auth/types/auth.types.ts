import type { createAuthClient } from 'better-auth/client';

export type AuthResult = { ok: true; email: string } | { ok: false; code?: string; message: string };
export type SocialAuthResult = { ok: true } | { ok: false; message: string };
export type AuthClient = ReturnType<typeof createAuthClient>;
export type SessionData = NonNullable<Awaited<ReturnType<AuthClient['getSession']>>['data']>;
export type UserProfile = SessionData['user'];
