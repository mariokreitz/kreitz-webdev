import { DatabaseConfig, databaseConfig } from '@app/config/database.config';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger: Logger = new Logger(PrismaService.name);

  constructor(@Inject(databaseConfig.KEY) config: DatabaseConfig) {
    super({
      adapter: new PrismaPg({ connectionString: config.url }),
      log: config.logQueries ? ['query', 'warn', 'error'] : ['warn', 'error'],
    });
  }

  public async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to database');
  }

  public async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
