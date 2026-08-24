import type { AuthClient } from '../tokens/auth-client.token';

export type AuthResult = { ok: true; email: string } | { ok: false; code?: string; message: string };
export type SocialAuthResult = { ok: true } | { ok: false; message: string };
export type ProfileUpdateResult = { ok: true } | { ok: false; message: string };
export type { AuthClient };
export type SessionData = NonNullable<AuthClient['$Infer']['Session']>;
export type UserProfile = SessionData['user'];
