import { PrismaService } from '@app/database/prisma';
import { WebsiteDomainRecord } from '@app/database/types/website-domain.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WebsiteDomainRepository {
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
    return this.prisma.websiteDomain.create({
      data: {
        websiteId,
        domain,
      },
    });
  }

  public async update(id: string, websiteId: string, domain: string): Promise<WebsiteDomainRecord | null> {
    const existing = await this.findByIdAndWebsiteId(id, websiteId);

    if (!existing) {
      return null;
    }

    return this.prisma.websiteDomain.update({
      where: {
        id,
      },
      data: {
        domain,
      },
    });
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
