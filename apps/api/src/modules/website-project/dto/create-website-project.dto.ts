import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateWebsiteProjectDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'ID of an existing project owned by the current user',
  })
  @IsString()
  public projectId!: string;

  @ApiPropertyOptional({
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  public published?: boolean;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  public sortOrder?: number;
}
