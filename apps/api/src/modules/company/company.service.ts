import { CacheService } from '@app/database/cache';
import { ICompanyRepository } from '@app/database/interfaces/company.repository.interface';
import { CompanyRecord, CreateCompanyData, UpdateCompanyData } from '@app/database/types/company.types';
import { WebsiteService } from '@app/modules/website';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { COMPANY_REPOSITORY } from './tokens/company.tokens';
import { buildWebsiteCompaniesCacheKey } from './utils/company.utils';

@Injectable()
export class CompanyService {
  constructor(
    private readonly websiteService: WebsiteService,

    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: ICompanyRepository,

    private readonly cacheService: CacheService,

    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(CompanyService.name);
  }

  public async getAllForUser(websiteId: string, userId: string): Promise<CompanyRecord[]> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    return this.companyRepository.findManyByWebsiteId(websiteId);
  }

  public async getByIdForUser(websiteId: string, companyId: string, userId: string): Promise<CompanyRecord> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    const company = await this.companyRepository.findByIdAndWebsiteId(companyId, websiteId);

    if (!company) {
      this.logger.warn({ event: 'company.rejected', reason: 'not_found', websiteId, companyId });

      throw new NotFoundException('Company not found');
    }

    return company;
  }

  public async create(websiteId: string, userId: string, data: CreateCompanyData): Promise<CompanyRecord> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    const created = await this.companyRepository.create(data);

    await this.cacheService.del(buildWebsiteCompaniesCacheKey(websiteId));

    this.logger.info({ event: 'company.created', websiteId, companyId: created.id });

    return created;
  }

  public async update(
    websiteId: string,
    companyId: string,
    userId: string,
    data: UpdateCompanyData,
  ): Promise<CompanyRecord> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    const updated = await this.companyRepository.update(companyId, websiteId, data);

    if (!updated) {
      this.logger.warn({ event: 'company.rejected', reason: 'not_found', websiteId, companyId });

      throw new NotFoundException('Company not found');
    }

    await this.cacheService.del(buildWebsiteCompaniesCacheKey(websiteId));

    this.logger.info({ event: 'company.updated', websiteId, companyId });

    return updated;
  }

  public async delete(websiteId: string, companyId: string, userId: string): Promise<void> {
    await this.websiteService.ensureOwnership(websiteId, userId);

    const deleted = await this.companyRepository.delete(companyId, websiteId);

    if (!deleted) {
      this.logger.warn({ event: 'company.rejected', reason: 'not_found', websiteId, companyId });

      throw new NotFoundException('Company not found');
    }

    await this.cacheService.del(buildWebsiteCompaniesCacheKey(websiteId));

    this.logger.info({ event: 'company.deleted', websiteId, companyId });
  }
}
