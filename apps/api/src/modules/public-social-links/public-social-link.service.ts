import { redisConfig, type RedisConfig } from '@app/config/redis.config';
import { CacheService } from '@app/database/cache';
import { IPublicSocialLinkRepository } from '@app/database/interfaces/public-social-link.repository.interface';
import { buildWebsiteSocialLinksCacheKey } from '@app/modules/social-link';
import { PublicSocialLinkDto } from '@app/modules/public-social-links/dto/public-social-link.dto';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PUBLIC_SOCIAL_LINK_REPOSITORY } from './tokens/public-social-link.tokens';

@Injectable()
export class PublicSocialLinkService {
  private readonly ttlMs: number;

  constructor(
    @Inject(PUBLIC_SOCIAL_LINK_REPOSITORY)
    private readonly publicSocialLinkRepository: IPublicSocialLinkRepository,

    private readonly cacheService: CacheService,

    @Inject(redisConfig.KEY) redis: RedisConfig,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PublicSocialLinkService.name);
    this.ttlMs = redis.ttlMs;
  }

  public async getSocialLinks(websiteId: string): Promise<PublicSocialLinkDto[]> {
    const socialLinks = await this.cacheService.getOrSet(
      buildWebsiteSocialLinksCacheKey(websiteId),
      this.ttlMs,
      async () => {
        const records = await this.publicSocialLinkRepository.findManyByWebsiteId(websiteId);

        return records.map((record): PublicSocialLinkDto => PublicSocialLinkDto.fromRecord(record));
      },
    );

    this.logger.info({ event: 'public_social_link.listed', websiteId, count: socialLinks.length });

    return socialLinks;
  }
}
