import type { createAuthClient } from 'better-auth/client';

export type AuthResult = { ok: true; email: string } | { ok: false; code?: string; message: string };
export type AuthClient = ReturnType<typeof createAuthClient>;
