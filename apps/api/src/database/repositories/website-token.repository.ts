import { IWebsiteTokenRepository } from '@app/database/interfaces/website-token.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { CreateWebsiteTokenData, WebsiteTokenRecord } from '@app/database/types/website-token.types';
import { ConflictException, Injectable } from '@nestjs/common';
import { isUniqueViolationOn } from '../utils/unique-violation';

const WEBSITE_TOKEN_HASH_UNIQUE_FIELDS = ['tokenHash'] as const;

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
    try {
      return await this.prisma.websiteToken.create({
        data: this.toCreateData(data),
      });
    } catch (error) {
      if (isUniqueViolationOn(error, WEBSITE_TOKEN_HASH_UNIQUE_FIELDS)) {
        throw new ConflictException('This website token could not be created, please try again');
      }

      throw error;
    }
  }

  public async delete(id: string, websiteId: string): Promise<WebsiteTokenRecord | null> {
    const existing = await this.findByIdAndWebsiteId(id, websiteId);

    if (!existing) {
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

  private toCreateData(data: CreateWebsiteTokenData): CreateWebsiteTokenData {
    return {
      websiteId: data.websiteId,
      name: data.name,
      prefix: data.prefix,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt ?? null,
    };
  }
}
