import { type DatabaseEnv, databaseSchema } from '@app/config/schemas/database.schema';
import { type ConfigType, registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => {
  const env: DatabaseEnv = databaseSchema.parse(process.env);

  // Prisma nimmt die Pool-Groesse als Query-Param der Connection-URL,
  // nicht als Client-Option. Ein Ort, an dem die URL entsteht.
  const url = new URL(env.DATABASE_URL);
  url.searchParams.set('connection_limit', String(env.DATABASE_POOL_SIZE));

  return {
    url: url.toString(),
    poolSize: env.DATABASE_POOL_SIZE,
    logQueries: env.DATABASE_LOG_QUERIES,
  };
});

export type DatabaseConfig = ConfigType<typeof databaseConfig>;
