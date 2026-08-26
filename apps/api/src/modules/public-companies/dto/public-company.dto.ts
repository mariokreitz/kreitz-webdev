import type { PublicCompanyRecord } from '@app/database/types/public-company.types';

import { ApiProperty } from '@nestjs/swagger';

export class PublicCompanyDto {
  @ApiProperty({
    example: 'clx1a2b3c4d5e6f7g8h9i0j1',
  })
  public id!: string;

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

  public static fromRecord(record: PublicCompanyRecord): PublicCompanyDto {
    return {
      id: record.id,
      name: record.name,
      role: record.role,
      logoUrl: record.logoUrl,
      startDate: record.startDate,
      endDate: record.endDate,
    };
  }
}
