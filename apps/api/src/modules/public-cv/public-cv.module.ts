import { redisConfig } from '@app/config';
import { CvDocumentModule } from '@app/modules/cv-document';
import { WebsiteModule } from '@app/modules/website';
import { WebsiteDomainModule } from '@app/modules/website-domain';
import { WebsiteTokenModule } from '@app/modules/website-token';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PublicCvController } from './public-cv.controller';
import { PublicCvService } from './public-cv.service';

@Module({
  imports: [
    WebsiteModule,
    WebsiteDomainModule,
    WebsiteTokenModule,
    CvDocumentModule,
    ConfigModule.forFeature(redisConfig),
  ],
  controllers: [PublicCvController],
  providers: [PublicCvService],
})
export class PublicCvModule {}
