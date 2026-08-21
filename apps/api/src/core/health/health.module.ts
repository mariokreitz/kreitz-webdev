import { healthConfig } from '@app/config/health.config';
import { RedisHealthIndicator } from '@app/core/health/indicators/redis-health.indicator';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, ConfigModule.forFeature(healthConfig)],
  controllers: [HealthController],
  providers: [RedisHealthIndicator],
})
export class HealthModule {}
