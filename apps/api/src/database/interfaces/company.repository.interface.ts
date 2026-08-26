import type { CompanyRecord, CreateCompanyData, UpdateCompanyData } from '@app/database/types/company.types';

export interface ICompanyRepository {
  findManyByWebsiteId: (websiteId: string) => Promise<CompanyRecord[]>;

  findByIdAndWebsiteId: (id: string, websiteId: string) => Promise<CompanyRecord | null>;

  create: (data: CreateCompanyData) => Promise<CompanyRecord>;

  update: (id: string, websiteId: string, data: UpdateCompanyData) => Promise<CompanyRecord | null>;

  delete: (id: string, websiteId: string) => Promise<boolean>;
}
