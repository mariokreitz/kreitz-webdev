import { appConfig } from '@app/config/app.config';
import { validateEnv } from '@app/config/validation/env.validation';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

const NODE_ENV = process.env.NODE_ENV ?? 'development';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      ignoreEnvFile: NODE_ENV === 'production',
      envFilePath: [`.env.${NODE_ENV}`, '.env.local', '.env'],
      validate: validateEnv,
      load: [appConfig],
    }),
  ],
  exports: [ConfigModule],
})
export class CoreModule {}
