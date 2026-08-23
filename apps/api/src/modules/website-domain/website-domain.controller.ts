import { WebsiteDomainRecord } from '@app/database/types/website-domain.types';
import { WebsiteDomainService } from '@app/modules/website-domain/website-domain.service';
import { Controller, Get, Param } from '@nestjs/common';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';

@Controller('websites/:websiteId/domains')
export class WebsiteDomainController {
  constructor(private readonly websiteDomainService: WebsiteDomainService) {}

  @Get()
  public async getAll(
    @Param('websiteId') websiteId: string,
    @Session() session: UserSession,
  ): Promise<WebsiteDomainRecord[]> {
    return this.websiteDomainService.getAllForUser(websiteId, session.user.id);
  }
}
