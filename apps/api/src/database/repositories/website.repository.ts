import { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { CreateWebsiteData, UpdateWebsiteData, WebsiteRecord } from '@app/database/types/website.repository.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WebsiteRepository implements IWebsiteRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<WebsiteRecord | null> {
    return this.prisma.website.findUnique({
      where: {
        id,
      },
    });
  }

  public async findByIdAndUserId(id: string, userId: string): Promise<WebsiteRecord | null> {
    return this.prisma.website.findFirst({
      where: {
        id,
        userId,
      },
    });
  }

  public async findBySlug(slug: string): Promise<WebsiteRecord | null> {
    return this.prisma.website.findUnique({
      where: {
        slug,
      },
    });
  }

  public async findBySlugAndUserId(slug: string, userId: string): Promise<WebsiteRecord | null> {
    return this.prisma.website.findFirst({
      where: {
        slug,
        userId,
      },
    });
  }

  public async findByDomain(domain: string): Promise<WebsiteRecord | null> {
    return this.prisma.website.findFirst({
      where: {
        domains: {
          some: {
            domain,
          },
        },
      },
    });
  }

  public async findManyByUserId(userId: string): Promise<WebsiteRecord[]> {
    return this.prisma.website.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  public async create(data: CreateWebsiteData): Promise<WebsiteRecord> {
    return this.prisma.website.create({
      data: {
        userId: data.userId,
        name: data.name,
        slug: data.slug,
        enabled: true,

        domains: {
          create: {
            domain: data.domain,
          },
        },
      },
    });
  }

  public async update(id: string, userId: string, data: UpdateWebsiteData): Promise<WebsiteRecord | null> {
    const website = await this.prisma.website.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!website) {
      return null;
    }

    return this.prisma.website.update({
      where: {
        id,
      },
      data,
    });
  }

  public async delete(id: string, userId: string): Promise<boolean> {
    const website = await this.prisma.website.findFirst({
      where: {
        id,
        userId,
      },
      select: {
        id: true,
      },
    });

    if (!website) {
      return false;
    }

    await this.prisma.website.delete({
      where: {
        id: website.id,
      },
    });

    return true;
  }
}
