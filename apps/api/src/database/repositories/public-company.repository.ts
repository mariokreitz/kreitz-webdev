import { IPublicCompanyRepository } from '@app/database/interfaces/public-company.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { PublicCompanyRecord } from '@app/database/types/public-company.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PublicCompanyRepository implements IPublicCompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findManyByWebsiteId(websiteId: string): Promise<PublicCompanyRecord[]> {
    return await this.prisma.company.findMany({
      where: {
        websiteId,
      },
      select: {
        id: true,
        name: true,
        role: true,
        logoUrl: true,
        startDate: true,
        endDate: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }
}
