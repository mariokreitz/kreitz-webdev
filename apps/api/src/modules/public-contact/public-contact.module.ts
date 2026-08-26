import { redisConfig } from '@app/config';
import { UserRepository } from '@app/database/repositories/user.repository';
import { WebsiteDomainModule } from '@app/modules/website-domain';
import { WebsiteTokenModule } from '@app/modules/website-token';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { PublicContactController } from './public-contact.controller';
import { PublicContactService } from './public-contact.service';
import { USER_REPOSITORY } from './tokens/public-contact.tokens';

@Module({
  imports: [WebsiteDomainModule, WebsiteTokenModule, ConfigModule.forFeature(redisConfig)],
  controllers: [PublicContactController],
  providers: [
    PublicContactService,

    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
})
export class PublicContactModule {}
