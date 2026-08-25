import { CvDocumentMeta } from '@app/database/types/cv-document.types';
import { ApiProperty } from '@nestjs/swagger';

export class CvStatusDto {
  @ApiProperty({
    example: 'mario-kreitz-cv.pdf',
  })
  public fileName!: string;

  @ApiProperty({
    example: 245_760,
  })
  public sizeBytes!: number;

  @ApiProperty()
  public uploadedAt!: Date;

  @ApiProperty()
  public updatedAt!: Date;

  public static fromRecord(record: CvDocumentMeta): CvStatusDto {
    const dto = new CvStatusDto();

    dto.fileName = record.fileName;
    dto.sizeBytes = record.sizeBytes;
    dto.uploadedAt = record.uploadedAt;
    dto.updatedAt = record.updatedAt;

    return dto;
  }
}
