import { SkipResponseEnvelope } from '@app/common/decorators/skip-response-envelope.decorator';
import { type HealthConfig, healthConfig } from '@app/config/health.config';
import { RedisHealthIndicator } from '@app/core/health/indicators/redis-health.indicator';
import { PrismaService } from '@app/database/prisma';
import { Controller, Get, Inject, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  type HealthIndicatorResult,
  MemoryHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
@AllowAnonymous()
@ApiTags('Health')
@SkipResponseEnvelope()
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
  @ApiOperation({ summary: 'Liveness probe — process is up and heap usage is within bounds' })
  @ApiResponse({ status: 200, description: 'Process is alive' })
  @ApiResponse({ status: 503, description: 'Heap usage exceeded the configured threshold' })
  public async live(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> => this.memory.checkHeap('memory_heap', this.config.heapBytes),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe — database and Redis are reachable' })
  @ApiResponse({ status: 200, description: 'Database and Redis are reachable' })
  @ApiResponse({ status: 503, description: 'Database or Redis is unreachable' })
  public async ready(): Promise<HealthCheckResult> {
    return this.health.check([
      async (): Promise<HealthIndicatorResult> =>
        this.prismaIndicator.pingCheck('database', this.prisma, { timeout: this.config.dbTimeoutMs }),
      async (): Promise<HealthIndicatorResult> => this.redisIndicator.isHealthy('redis'),
    ]);
  }
}
