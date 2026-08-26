import { ICompanyRepository } from '@app/database/interfaces/company.repository.interface';
import { PrismaService } from '@app/database/prisma';
import { CompanyRecord, CreateCompanyData, UpdateCompanyData } from '@app/database/types/company.types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CompanyRepository implements ICompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async findManyByWebsiteId(websiteId: string): Promise<CompanyRecord[]> {
    return await this.prisma.company.findMany({
      where: {
        websiteId,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  public async findByIdAndWebsiteId(id: string, websiteId: string): Promise<CompanyRecord | null> {
    return await this.prisma.company.findFirst({
      where: {
        id,
        websiteId,
      },
    });
  }

  public async create(data: CreateCompanyData): Promise<CompanyRecord> {
    return await this.prisma.company.create({
      data: {
        websiteId: data.websiteId,
        name: data.name,

        ...(data.role !== undefined && { role: data.role }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
  }

  public async update(id: string, websiteId: string, data: UpdateCompanyData): Promise<CompanyRecord | null> {
    const result = await this.prisma.company.updateMany({
      where: {
        id,
        websiteId,
      },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    if (result.count === 0) {
      return null;
    }

    return await this.findByIdAndWebsiteId(id, websiteId);
  }

  public async delete(id: string, websiteId: string): Promise<boolean> {
    const result = await this.prisma.company.deleteMany({
      where: {
        id,
        websiteId,
      },
    });

    return result.count > 0;
  }
}
