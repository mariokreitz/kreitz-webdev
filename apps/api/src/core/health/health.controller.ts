import { type HealthConfig, healthConfig } from '@app/config/health.config';
import { PrismaService } from '@app/core/prisma/prisma.service';
import { Controller, Get, Inject, VERSION_NEUTRAL } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  type HealthIndicatorResult,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { RedisHealthIndicator } from './redis-health.indicator';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
@AllowAnonymous()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly prismaIndicator: PrismaHealthIndicator,
    private readonly redisIndicator: RedisHealthIndicator,
    private readonly prisma: PrismaService,
    @Inject(healthConfig.KEY) private readonly config: HealthConfig,
  ) {}

  @Get('live')
  @HealthCheck()
  public async live(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => this.memory.checkHeap('memory_heap', this.config.heapBytes),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  public async ready(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> =>
        this.prismaIndicator.pingCheck('database', this.prisma, { timeout: this.config.dbTimeoutMs }),
      async (): Promise<HealthIndicatorResult> => this.redisIndicator.isHealthy('redis'),
    ]);
  }
}
