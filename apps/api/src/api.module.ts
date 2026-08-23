import { CoreModule } from '@app/core/core.module';
import { ProjectModule } from '@app/modules/project/project.module';
import { WebsiteDomainModule } from '@app/modules/website-domain/website-domain.module';
import { WebsiteModule } from '@app/modules/website/website.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [CoreModule, ProjectModule, WebsiteModule, WebsiteDomainModule],
})
export class ApiModule {}
