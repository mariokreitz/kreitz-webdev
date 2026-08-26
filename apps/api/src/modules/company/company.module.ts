import { CompanyRepository } from '@app/database/repositories/company.repository';
import { WebsiteModule } from '@app/modules/website';
import { Module } from '@nestjs/common';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { COMPANY_REPOSITORY } from './tokens/company.tokens';

@Module({
  imports: [WebsiteModule],
  controllers: [CompanyController],
  providers: [
    CompanyService,

    {
      provide: COMPANY_REPOSITORY,
      useClass: CompanyRepository,
    },
  ],
  exports: [CompanyService, COMPANY_REPOSITORY],
})
export class CompanyModule {}
