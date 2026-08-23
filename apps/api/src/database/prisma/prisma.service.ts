import { DatabaseConfig, databaseConfig } from '@app/config/database.config';
import { Inject, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PinoLogger } from 'nestjs-pino';
import { PrismaClient } from '../../../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject(databaseConfig.KEY) config: DatabaseConfig,
    private readonly logger: PinoLogger,
  ) {
    super({
      adapter: new PrismaPg({ connectionString: config.url }),
      log: config.logQueries ? ['query', 'warn', 'error'] : ['warn', 'error'],
    });

    this.logger.setContext(PrismaService.name);
  }

  public async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.info({ event: 'prisma.connected' });
  }

  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
