import { redisConfig } from '@app/config';
import { PublicCompanyRepository } from '@app/database/repositories/public-company.repository';
import { WebsiteDomainModule } from '@app/modules/website-domain';
import { WebsiteTokenModule } from '@app/modules/website-token';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PublicCompanyController } from './public-company.controller';
import { PublicCompanyService } from './public-company.service';
import { PUBLIC_COMPANY_REPOSITORY } from './tokens/public-company.tokens';

@Module({
  imports: [WebsiteDomainModule, WebsiteTokenModule, ConfigModule.forFeature(redisConfig)],
  controllers: [PublicCompanyController],
  providers: [
    PublicCompanyService,

    {
      provide: PUBLIC_COMPANY_REPOSITORY,
      useClass: PublicCompanyRepository,
    },
  ],
})
export class PublicCompanyModule {}
