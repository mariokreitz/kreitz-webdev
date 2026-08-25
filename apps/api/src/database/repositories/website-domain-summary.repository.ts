import { IWebsiteDomainSummaryRepository } from '@app/database/interfaces/website-domain-summary.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { WebsiteDomainSummaryRecord } from '@app/database/types/website-domain-summary.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WebsiteDomainSummaryRepository implements IWebsiteDomainSummaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async countForUser(userId: string): Promise<WebsiteDomainSummaryRecord> {
    const [total, verified] = await Promise.all([
      this.prisma.websiteDomain.count({
        where: {
          website: {
            userId,
            enabled: true,
          },
        },
      }),
      this.prisma.websiteDomain.count({
        where: {
          website: {
            userId,
            enabled: true,
          },
          verified: true,
        },
      }),
    ]);

    return { total, verified };
  }
}
