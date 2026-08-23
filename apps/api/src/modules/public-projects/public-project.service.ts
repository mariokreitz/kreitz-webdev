import { redisConfig, type RedisConfig } from '@app/config/redis.config';
import { CacheService } from '@app/database/cache';
import { IPublicProjectRepository } from '@app/database/interfaces/public-project.repository.interface';
import { PublicProjectDto } from '@app/modules/public-projects/dto/public-project.dto';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PUBLIC_PROJECT_REPOSITORY } from './tokens/public-project.tokens';

@Injectable()
export class PublicProjectService {
  private readonly ttlMs: number;

  constructor(
    @Inject(PUBLIC_PROJECT_REPOSITORY)
    private readonly publicProjectRepository: IPublicProjectRepository,

    private readonly cacheService: CacheService,

    @Inject(redisConfig.KEY) redis: RedisConfig,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PublicProjectService.name);
    this.ttlMs = redis.ttlMs;
  }

  public async getPublishedProjects(websiteId: string): Promise<PublicProjectDto[]> {
    const projects = await this.cacheService.getOrSet(`website:${websiteId}:projects`, this.ttlMs, async () => {
      const records = await this.publicProjectRepository.findPublishedByWebsiteId(websiteId);

      return records.map((record): PublicProjectDto => PublicProjectDto.fromRecord(record));
    });

    this.logger.info({ event: 'public_project.listed', websiteId, count: projects.length });

    return projects;
  }
}
