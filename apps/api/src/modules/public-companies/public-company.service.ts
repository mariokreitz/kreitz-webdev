import { redisConfig, type RedisConfig } from '@app/config/redis.config';
import { CacheService } from '@app/database/cache';
import { IPublicCompanyRepository } from '@app/database/interfaces/public-company.repository.interface';
import { buildWebsiteCompaniesCacheKey } from '@app/modules/company';
import { PublicCompanyDto } from '@app/modules/public-companies/dto/public-company.dto';
import { Inject, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PUBLIC_COMPANY_REPOSITORY } from './tokens/public-company.tokens';

@Injectable()
export class PublicCompanyService {
  private readonly ttlMs: number;

  constructor(
    @Inject(PUBLIC_COMPANY_REPOSITORY)
    private readonly publicCompanyRepository: IPublicCompanyRepository,

    private readonly cacheService: CacheService,

    @Inject(redisConfig.KEY) redis: RedisConfig,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PublicCompanyService.name);
    this.ttlMs = redis.ttlMs;
  }

  public async getCompanies(websiteId: string): Promise<PublicCompanyDto[]> {
    const companies = await this.cacheService.getOrSet(
      buildWebsiteCompaniesCacheKey(websiteId),
      this.ttlMs,
      async () => {
        const records = await this.publicCompanyRepository.findManyByWebsiteId(websiteId);

        return records.map((record): PublicCompanyDto => PublicCompanyDto.fromRecord(record));
      },
    );

    this.logger.info({ event: 'public_company.listed', websiteId, count: companies.length });

    return companies;
  }
}
