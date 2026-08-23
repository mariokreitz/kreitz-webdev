import { IWebsiteTokenRepository } from '@app/database/interfaces/website-token.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { CreateWebsiteTokenData, WebsiteTokenRecord } from '@app/database/types/website-token.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WebsiteTokenRepository implements IWebsiteTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findByTokenHash(tokenHash: string): Promise<WebsiteTokenRecord | null> {
    return this.prisma.websiteToken.findUnique({
      where: {
        tokenHash,
      },
    });
  }

  public async findManyByWebsiteId(websiteId: string): Promise<WebsiteTokenRecord[]> {
    return this.prisma.websiteToken.findMany({
      where: {
        websiteId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  public async findByIdAndWebsiteId(id: string, websiteId: string): Promise<WebsiteTokenRecord | null> {
    return this.prisma.websiteToken.findFirst({
      where: {
        id,
        websiteId,
      },
    });
  }

  public async create(data: CreateWebsiteTokenData): Promise<WebsiteTokenRecord> {
    return this.prisma.websiteToken.create({
      data: {
        websiteId: data.websiteId,
        name: data.name,
        prefix: data.prefix,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt ?? null,
      },
    });
  }

  public async delete(id: string, websiteId: string): Promise<WebsiteTokenRecord | null> {
    const token = await this.findByIdAndWebsiteId(id, websiteId);

    if (!token) {
      return null;
    }

    return this.prisma.websiteToken.delete({
      where: {
        id,
      },
    });
  }

  public async updateLastUsedAt(id: string, lastUsedAt: Date): Promise<void> {
    await this.prisma.websiteToken.update({
      where: {
        id,
      },
      data: {
        lastUsedAt,
      },
    });
  }
}
