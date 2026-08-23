import { CoreModule } from '@app/core/core.module';
import { GithubImportModule } from '@app/modules/github-import';
import { ProjectModule } from '@app/modules/project';
import { PublicProjectModule } from '@app/modules/public-projects';
import { WebsiteDomainModule } from '@app/modules/website-domain/website-domain.module';
import { WebsiteProjectModule } from '@app/modules/website-project';
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
    WebsiteProjectModule,
    PublicProjectModule,
    GithubImportModule,
  ],
})
export class ApiModule {}
