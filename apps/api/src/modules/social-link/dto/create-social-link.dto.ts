import type { CreateSocialLinkData } from '@app/database/types/social-link.types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength, Min } from 'class-validator';

export class CreateSocialLinkDto {
  @ApiProperty({
    example: 'github',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  public platform!: string;

  @ApiPropertyOptional({
    example: 'GitHub',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  public label?: string;

  @ApiProperty({
    example: 'https://github.com/mariokreitz',
  })
  @IsUrl()
  public url!: string;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  public sortOrder?: number;

  public toCreateSocialLinkData(websiteId: string): CreateSocialLinkData {
    return {
      websiteId,
      platform: this.platform,
      url: this.url,

      ...(this.label !== undefined && { label: this.label }),
      ...(this.sortOrder !== undefined && { sortOrder: this.sortOrder }),
    };
  }
}
