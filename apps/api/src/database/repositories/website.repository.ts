import { IWebsiteRepository } from '@app/database/interfaces/website.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { CreateWebsiteData, UpdateWebsiteData, WebsiteRecord } from '@app/database/types/website.repository.types';
import { ConflictException, Injectable } from '@nestjs/common';
import { isUniqueViolationOn } from '../utils/unique-violation';

const WEBSITE_SLUG_UNIQUE_FIELDS = ['slug'] as const;
const WEBSITE_DOMAIN_UNIQUE_FIELDS = ['domain'] as const;

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
              verificationToken: data.verificationToken,
            },
          },
        },
      });
    } catch (error) {
      if (isUniqueViolationOn(error, WEBSITE_SLUG_UNIQUE_FIELDS)) {
        throw new ConflictException('A website with this slug already exists');
      }

      if (isUniqueViolationOn(error, WEBSITE_DOMAIN_UNIQUE_FIELDS)) {
        throw new ConflictException('This domain is already registered');
      }

      throw error;
    }
  }

  public async update(id: string, userId: string, data: UpdateWebsiteData): Promise<WebsiteRecord | null> {
    try {
      const result = await this.prisma.website.updateMany({
        where: {
          id,
          userId,
        },
        data,
      });

      if (result.count === 0) {
        return null;
      }

      return await this.findByIdAndUserId(id, userId);
    } catch (error) {
      if (isUniqueViolationOn(error, WEBSITE_SLUG_UNIQUE_FIELDS)) {
        throw new ConflictException('A website with this slug already exists');
      }

      throw error;
    }
  }

  public async delete(id: string, userId: string): Promise<boolean> {
    const result = await this.prisma.website.deleteMany({
      where: {
        id,
        userId,
      },
    });

    return result.count > 0;
  }
}
