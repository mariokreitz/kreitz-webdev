import { CompanyRecord } from '@app/database/types/company.types';
import { ApiProperty } from '@nestjs/swagger';

export class CompanyDto {
  @ApiProperty({
    example: 'clx1a2b3c4d5e6f7g8h9i0j1',
  })
  public id!: string;

  @ApiProperty({
    example: 'clx0z9y8x7w6v5u4t3s2r1q0',
  })
  public websiteId!: string;

  @ApiProperty({
    example: 'Acme Corp',
  })
  public name!: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Senior Software Engineer',
  })
  public role!: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'https://example.com/acme-logo.png',
  })
  public logoUrl!: string | null;

  @ApiProperty({
    nullable: true,
    example: '2022-01-01T00:00:00.000Z',
  })
  public startDate!: Date | null;

  @ApiProperty({
    nullable: true,
    example: '2024-06-01T00:00:00.000Z',
  })
  public endDate!: Date | null;

  @ApiProperty({
    example: 0,
  })
  public sortOrder!: number;

  @ApiProperty()
  public createdAt!: Date;

  @ApiProperty()
  public updatedAt!: Date;

  public static fromRecord(record: CompanyRecord): CompanyDto {
    const dto = new CompanyDto();

    dto.id = record.id;
    dto.websiteId = record.websiteId;
    dto.name = record.name;
    dto.role = record.role;
    dto.logoUrl = record.logoUrl;
    dto.startDate = record.startDate;
    dto.endDate = record.endDate;
    dto.sortOrder = record.sortOrder;
    dto.createdAt = record.createdAt;
    dto.updatedAt = record.updatedAt;

    return dto;
  }
}
