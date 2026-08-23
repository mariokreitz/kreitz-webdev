import { IWebsiteDomainRepository } from '@app/database/interfaces/website-domain.repository.interface';
import { PrismaService } from '@app/database/prisma';

import {
  CreateWebsiteDomainData,
  UpdateWebsiteDomainData,
  WebsiteDomainRecord,
} from '@app/database/types/website-domain.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class WebsiteDomainRepository implements IWebsiteDomainRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findById(id: string): Promise<WebsiteDomainRecord | null> {
    return this.prisma.websiteDomain.findUnique({
      where: {
        id,
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

  public async create(data: CreateWebsiteDomainData): Promise<WebsiteDomainRecord> {
    return this.prisma.websiteDomain.create({
      data: {
        websiteId: data.websiteId,
        domain: data.domain,
      },
    });
  }

  public async update(
    id: string,
    websiteId: string,
    data: UpdateWebsiteDomainData,
  ): Promise<WebsiteDomainRecord | null> {
    const existingDomain = await this.prisma.websiteDomain.findFirst({
      where: {
        id,
        websiteId,
      },
    });

    if (!existingDomain) {
      return null;
    }

    return this.prisma.websiteDomain.update({
      where: {
        id,
      },
      data: {
        domain: data.domain,
        verified: false,
        verifiedAt: null,
      },
    });
  }

  public async delete(id: string, websiteId: string): Promise<boolean> {
    const existingDomain = await this.prisma.websiteDomain.findFirst({
      where: {
        id,
        websiteId,
      },
      select: {
        id: true,
      },
    });

    if (!existingDomain) {
      return false;
    }

    await this.prisma.websiteDomain.delete({
      where: {
        id: existingDomain.id,
      },
    });

    return true;
  }
}
