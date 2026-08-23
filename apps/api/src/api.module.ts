import { CoreModule } from '@app/core/core.module';
import { ProjectModule } from '@app/modules/project/project.module';
import { PublicProjectModule } from '@app/modules/public-projects/public-project.module';
import { WebsiteDomainModule } from '@app/modules/website-domain/website-domain.module';
import { WebsiteTokenModule } from '@app/modules/website-token/website-token.module';
import { WebsiteModule } from '@app/modules/website/website.module';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    CoreModule,
    ProjectModule,
    WebsiteModule,
    WebsiteDomainModule,
    WebsiteTokenModule,
    ProjectModule,
    PublicProjectModule,
  ],
})
export class ApiModule {}
