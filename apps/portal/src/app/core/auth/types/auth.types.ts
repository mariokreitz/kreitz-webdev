export type AuthResult = { ok: true; email: string } | { ok: false; code?: string; message: string };
