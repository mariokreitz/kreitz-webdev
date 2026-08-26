import { CreateWebsiteDto } from '@app/modules/website/dto/create-website.dto';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional } from 'class-validator';

export class UpdateWebsiteDto extends PartialType(CreateWebsiteDto) {
  @ApiPropertyOptional({
    example: true,
    description: 'Whether the website is enabled',
  })
  @IsOptional()
  @IsBoolean()
  public enabled?: boolean;

  @ApiPropertyOptional({
    example: 'owner@example.com',
    nullable: true,
    description:
      'Contact form recipient address. Falls back to the account email when left unset or explicitly cleared with null.',
  })
  @IsOptional()
  @IsEmail()
  public contactEmail?: string | null;
}
