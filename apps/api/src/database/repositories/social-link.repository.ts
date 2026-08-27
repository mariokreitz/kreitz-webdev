import { ISocialLinkRepository } from '@app/database/interfaces/social-link.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { CreateSocialLinkData, SocialLinkRecord, UpdateSocialLinkData } from '@app/database/types/social-link.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SocialLinkRepository implements ISocialLinkRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findManyByWebsiteId(websiteId: string): Promise<SocialLinkRecord[]> {
    return await this.prisma.socialLink.findMany({
      where: {
        websiteId,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  public async findByIdAndWebsiteId(id: string, websiteId: string): Promise<SocialLinkRecord | null> {
    return await this.prisma.socialLink.findFirst({
      where: {
        id,
        websiteId,
      },
    });
  }

  public async create(data: CreateSocialLinkData): Promise<SocialLinkRecord> {
    return await this.prisma.socialLink.create({
      data: {
        websiteId: data.websiteId,
        platform: data.platform,
        url: data.url,

        ...(data.label !== undefined && { label: data.label }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
  }

  public async update(id: string, websiteId: string, data: UpdateSocialLinkData): Promise<SocialLinkRecord | null> {
    const result = await this.prisma.socialLink.updateMany({
      where: {
        id,
        websiteId,
      },
      data: {
        ...(data.platform !== undefined && { platform: data.platform }),
        ...(data.label !== undefined && { label: data.label }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return await this.findByIdAndWebsiteId(id, websiteId);
  }

  public async delete(id: string, websiteId: string): Promise<boolean> {
    const result = await this.prisma.socialLink.deleteMany({
      where: {
        id,
        websiteId,
      },
    });

    return result.count > 0;
  }
}
