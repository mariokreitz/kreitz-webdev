import type { createAuth } from '../strategies/auth.factory';

export type Auth = ReturnType<typeof createAuth>;
