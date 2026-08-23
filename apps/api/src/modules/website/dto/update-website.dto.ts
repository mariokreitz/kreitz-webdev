import { CreateWebsiteDto } from '@app/modules/website/dto/create-website.dto';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateWebsiteDto extends PartialType(CreateWebsiteDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Whether the website is enabled',
  })
  @IsOptional()
  @IsBoolean()
  public enabled?: boolean;
}
