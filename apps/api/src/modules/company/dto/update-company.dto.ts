import type { UpdateCompanyData } from '@app/database/types/company.types';
import { PartialType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
  public toUpdateCompanyData(): UpdateCompanyData {
    return {
      ...(this.name !== undefined && { name: this.name }),
      ...(this.role !== undefined && { role: this.role }),
      ...(this.logoUrl !== undefined && { logoUrl: this.logoUrl }),
      ...(this.startDate !== undefined && { startDate: new Date(this.startDate) }),
      ...(this.endDate !== undefined && { endDate: new Date(this.endDate) }),
      ...(this.sortOrder !== undefined && { sortOrder: this.sortOrder }),
    };
  }
}
