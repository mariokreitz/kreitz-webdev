import { IWebsiteDomainRepository } from '@app/database/interfaces/website-domain.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { WebsiteDomainRecord } from '@app/database/types/website-domain.types';
import { ConflictException, Injectable } from '@nestjs/common';
import { isUniqueViolationOn } from '../utils/unique-violation';

const WEBSITE_DOMAIN_UNIQUE_FIELDS = ['domain'] as const;

@Injectable()
export class WebsiteDomainRepository implements IWebsiteDomainRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  public async findByIdAndWebsiteId(id: string, websiteId: string): Promise<WebsiteDomainRecord | null> {
    return this.prisma.websiteDomain.findFirst({
      where: {
        id,
        websiteId,
      },
    });
  }

  public async findByDomain(domain: string): Promise<WebsiteDomainRecord | null> {
    return this.prisma.websiteDomain.findUnique({
      where: {
        domain,
      },
    });
  }

  public async findVerifiedByDomain(domain: string): Promise<WebsiteDomainRecord | null> {
    return this.prisma.websiteDomain.findFirst({
      where: {
        domain,
        verified: true,
      },
    });
  }

  public async create(websiteId: string, domain: string): Promise<WebsiteDomainRecord> {
    try {
      return await this.prisma.websiteDomain.create({
        data: {
          websiteId,
          domain,
        },
      });
    } catch (error) {
      if (isUniqueViolationOn(error, WEBSITE_DOMAIN_UNIQUE_FIELDS)) {
        throw new ConflictException('This domain is already registered');
      }

      throw error;
    }
  }

  public async update(id: string, websiteId: string, domain: string): Promise<WebsiteDomainRecord | null> {
    const existing = await this.findByIdAndWebsiteId(id, websiteId);

    if (!existing) {
      return null;
    }

    try {
      return await this.prisma.websiteDomain.update({
        where: {
          id,
        },
        data: {
          domain,
        },
      });
    } catch (error) {
      if (isUniqueViolationOn(error, WEBSITE_DOMAIN_UNIQUE_FIELDS)) {
        throw new ConflictException('This domain is already registered');
      }

      throw error;
    }
  }

  public async delete(id: string, websiteId: string): Promise<WebsiteDomainRecord | null> {
    const existing = await this.findByIdAndWebsiteId(id, websiteId);

    if (!existing) {
      return null;
    }

    return this.prisma.websiteDomain.delete({
      where: {
        id,
      },
    });
  }
}
