import { IWebsiteDomainRepository } from '@app/database/interfaces/website-domain.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { WebsiteDomainRecord } from '@app/database/types/website-domain.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WebsiteDomainRepository implements IWebsiteDomainRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findByIdAndWebsiteId(id: string, websiteId: string): Promise<WebsiteDomainRecord | null> {
    return this.prisma.websiteDomain.findFirst({
      where: {
        id,
        websiteId,
      },
    });
  }

  public async findManyByWebsiteId(websiteId: string): Promise<WebsiteDomainRecord[]> {
    return this.prisma.websiteDomain.findMany({
      where: {
        websiteId,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}
