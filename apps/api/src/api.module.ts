import { CoreModule } from '@app/core/core.module';
import { CompanyModule } from '@app/modules/company';
import { CvDocumentModule } from '@app/modules/cv-document';
import { DashboardModule } from '@app/modules/dashboard';
import { GithubImportModule } from '@app/modules/github-import';
import { ProjectModule } from '@app/modules/project';
import { PublicCompanyModule } from '@app/modules/public-companies';
import { PublicContactModule } from '@app/modules/public-contact';
import { PublicCvModule } from '@app/modules/public-cv';
import { PublicProjectModule } from '@app/modules/public-projects';
import { PublicSocialLinkModule } from '@app/modules/public-social-links';
import { SocialLinkModule } from '@app/modules/social-link';
import { WebsiteModule } from '@app/modules/website';
import { WebsiteDomainModule } from '@app/modules/website-domain';
import { WebsiteProjectModule } from '@app/modules/website-project';
import { WebsiteTokenModule } from '@app/modules/website-token';
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
    PublicContactModule,
    CompanyModule,
    PublicCompanyModule,
    SocialLinkModule,
    PublicSocialLinkModule,
    CvDocumentModule,
    PublicCvModule,
    GithubImportModule,
    DashboardModule,
  ],
})
export class ApiModule {}
