import { z } from 'zod';

const boolFromEnv = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const boolFromEnvDefaultTrue = z
  .enum(['true', 'false'])
  .default('true')
  .transform((value) => value === 'true');

// --- App ------------------------------------------------------------------

export const appSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

// --- Datenbank ------------------------------------------------------------

export const databaseSchema = z.object({
  DATABASE_URL: z.url().startsWith('postgresql://'),
  DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(50).default(10),
  DATABASE_LOG_QUERIES: boolFromEnv,
});

// --- Auth -----------------------------------------------------------------

export const authSchema = z.object({
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_ISSUER: z.string().default('app'),
  JWT_AUDIENCE: z.string().default('app-api'),
  REFRESH_TTL_MS: z.coerce.number().int().positive().default(604_800_000),
  MAX_FAILED_LOGINS: z.coerce.number().int().positive().default(5),
  LOCKOUT_MS: z.coerce.number().int().positive().default(900_000),
});

// --- Redis / Cache --------------------------------------------------------

const redisUrl = z.string().refine((value) => value.startsWith('redis://') || value.startsWith('rediss://'), {
  message: 'must start with redis:// or rediss://',
});

export const redisSchema = z.object({
  REDIS_URL: redisUrl,
  REDIS_KEY_PREFIX: z.string().min(1).default('app'),
  REDIS_COMMAND_TIMEOUT_MS: z.coerce.number().int().positive().default(1_000),
  REDIS_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().default(5_000),
  CACHE_TTL_MS: z.coerce.number().int().positive().default(60_000),
  CACHE_MEMORY_TTL_MS: z.coerce.number().int().positive().default(10_000),
  CACHE_MEMORY_LRU_SIZE: z.coerce.number().int().positive().default(1_000),
  /// BullMQ vertraegt keinen ioredis keyPrefix. Es hat seine eigene prefix-Option.
  QUEUE_PREFIX: z.string().min(1).default('app-queue'),
});

// --- Throttling -----------------------------------------------------------

export const throttleSchema = z.object({
  THROTTLE_SHORT_LIMIT: z.coerce.number().int().positive().default(5),
  THROTTLE_MEDIUM_LIMIT: z.coerce.number().int().positive().default(30),
  THROTTLE_LONG_LIMIT: z.coerce.number().int().positive().default(200),
  THROTTLE_TRUST_PROXY: boolFromEnv,
  /// Bei Redis-Ausfall durchlassen statt blocken. A10-Trade-off.
  THROTTLE_FAIL_OPEN: boolFromEnvDefaultTrue,
  THROTTLE_CIRCUIT_COOLDOWN_MS: z.coerce.number().int().positive().default(5_000),
});

// --- Health ---------------------------------------------------------------

export const healthSchema = z.object({
  HEALTH_HEAP_MB: z.coerce.number().int().positive().default(512),
  HEALTH_DB_TIMEOUT_MS: z.coerce.number().int().positive().default(2_000),
});

// --- Security / OWASP A02 -------------------------------------------------

export const securitySchema = z.object({
  CORS_ORIGINS: z
    .string()
    .default('')
    .transform((value) =>
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0),
    ),
  CORS_CREDENTIALS: boolFromEnv,
  BODY_LIMIT: z.string().default('100kb'),
  COOKIE_SECRET: z.string().min(32),
  ENABLE_SWAGGER: boolFromEnv,
});

// --- Passwort-Reset / URLs ------------------------------------------------

export const resetSchema = z.object({
  RESET_TOKEN_TTL_MS: z.coerce.number().int().positive().default(1_800_000),
  RESET_MAX_PER_EMAIL_PER_HOUR: z.coerce.number().int().positive().default(3),
  APP_BASE_URL: z.url(),
});

// --- E-Mail-Verifikation --------------------------------------------------

export const verificationSchema = z.object({
  VERIFICATION_TOKEN_TTL_MS: z.coerce.number().int().positive().default(86_400_000),
  VERIFICATION_MAX_PER_HOUR: z.coerce.number().int().positive().default(3),
  VERIFICATION_ENFORCEMENT_MODE: z.enum(['off', 'warn', 'enforce']).default('warn'),
  VERIFICATION_GRACE_PERIOD_MS: z.coerce.number().int().min(0).default(604_800_000),
});

// --- Mail -----------------------------------------------------------------

export const mailSchema = z.object({
  MAIL_HOST: z.string().min(1),
  MAIL_PORT: z.coerce.number().int().positive().default(587),
  MAIL_SECURE: boolFromEnv,
  MAIL_USER: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  MAIL_FROM_NAME: z.string().default('App'),
  MAIL_FROM_ADDRESS: z.email(),
  MAIL_REPLY_TO: z.email().optional(),
  MAIL_DRY_RUN: boolFromEnv,
  MAIL_POOL: boolFromEnvDefaultTrue,
});

// --- GitHub OAuth ---------------------------------------------------------

export const githubSchema = z.object({
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_CALLBACK_URL: z.url(),
  GITHUB_STATE_TTL_MS: z.coerce.number().int().positive().default(600_000),
  /// Allowlist gegen Open Redirect nach dem Login.
  GITHUB_ALLOWED_RETURN_PATHS: z
    .string()
    .default('/')
    .transform((value) =>
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
});

// --- Gesamtschema ---------------------------------------------------------

export const envSchema = z.object({
  ...databaseSchema.shape,
  ...authSchema.shape,
  ...redisSchema.shape,
  ...throttleSchema.shape,
  ...healthSchema.shape,
  ...securitySchema.shape,
  ...resetSchema.shape,
  ...verificationSchema.shape,
  ...mailSchema.shape,
  ...githubSchema.shape,
});

export type Env = z.infer<typeof envSchema>;
