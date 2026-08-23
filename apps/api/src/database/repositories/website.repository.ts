import { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { CreateWebsiteData, UpdateWebsiteData, WebsiteRecord } from '@app/database/types/website.repository.types';
import { ConflictException, Injectable } from '@nestjs/common';
import { isUniqueViolationOn } from '../utils/unique-violation';

const WEBSITE_SLUG_UNIQUE_FIELDS = ['slug'] as const;

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
    try {
      return await this.prisma.website.create({
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
    } catch (error) {
      if (isUniqueViolationOn(error, WEBSITE_SLUG_UNIQUE_FIELDS)) {
        throw new ConflictException('A website with this slug already exists');
      }

      throw error;
    }
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

    try {
      return await this.prisma.website.update({
        where: {
          id,
        },
        data,
      });
    } catch (error) {
      if (isUniqueViolationOn(error, WEBSITE_SLUG_UNIQUE_FIELDS)) {
        throw new ConflictException('A website with this slug already exists');
      }

      throw error;
    }
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
