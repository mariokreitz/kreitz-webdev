import { healthConfig } from '@app/config/health.config';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisHealthIndicator } from './redis-health.indicator';

@Module({
  imports: [TerminusModule, ConfigModule.forFeature(healthConfig)],
  controllers: [HealthController],
  providers: [RedisHealthIndicator],
})
export class HealthModule {}
