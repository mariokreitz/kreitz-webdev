export interface CompanyRecord {
  id: string;
  websiteId: string;

  name: string;
  role: string | null;
  logoUrl: string | null;
  startDate: Date | null;
  endDate: Date | null;
  sortOrder: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCompanyData {
  websiteId: string;
  name: string;

  role?: string;
  logoUrl?: string;
  startDate?: Date;
  endDate?: Date;
  sortOrder?: number;
}

export interface UpdateCompanyData {
  name?: string;
  role?: string;
  logoUrl?: string;
  startDate?: Date;
  endDate?: Date;
  sortOrder?: number;
}
