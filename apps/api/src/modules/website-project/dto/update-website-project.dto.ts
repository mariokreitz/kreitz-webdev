import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateWebsiteProjectDto {
  @ApiPropertyOptional({
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  public published?: boolean;

  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  public sortOrder?: number;
}
