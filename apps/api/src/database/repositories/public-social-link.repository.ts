import { IPublicSocialLinkRepository } from '@app/database/interfaces/public-social-link.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { PublicSocialLinkRecord } from '@app/database/types/public-social-link.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PublicSocialLinkRepository implements IPublicSocialLinkRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findManyByWebsiteId(websiteId: string): Promise<PublicSocialLinkRecord[]> {
    return await this.prisma.socialLink.findMany({
      where: {
        websiteId,
      },
      select: {
        id: true,
        platform: true,
        label: true,
        url: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }
}
