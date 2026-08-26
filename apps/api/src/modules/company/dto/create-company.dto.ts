import type { CreateCompanyData } from '@app/database/types/company.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, IsString, IsUrl, MaxLength, Min } from 'class-validator';

export class CreateCompanyDto {
  @ApiProperty({
    example: 'Acme Corp',
  })
  @IsString()
  @MaxLength(200)
  public name!: string;

  @ApiPropertyOptional({
    example: 'Senior Software Engineer',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  public role?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/acme-logo.png',
  })
  @IsOptional()
  @IsUrl()
  public logoUrl?: string;

  @ApiPropertyOptional({
    example: '2022-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  public startDate?: string;

  @ApiPropertyOptional({
    example: '2024-06-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  public endDate?: string;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  public sortOrder?: number;

  public toCreateCompanyData(websiteId: string): CreateCompanyData {
    return {
      websiteId,
      name: this.name,

      ...(this.role !== undefined && { role: this.role }),
      ...(this.logoUrl !== undefined && { logoUrl: this.logoUrl }),
      ...(this.startDate !== undefined && { startDate: new Date(this.startDate) }),
      ...(this.endDate !== undefined && { endDate: new Date(this.endDate) }),
      ...(this.sortOrder !== undefined && { sortOrder: this.sortOrder }),
    };
  }
}
