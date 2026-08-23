import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl } from 'class-validator';

export class CreateWebsiteDomainDto {
  @ApiProperty({
    example: 'https://www.kreitz-webdev.de/',
    description: 'Website URL. The protocol is required.',
  })
  @IsString()
  @IsUrl({
    require_protocol: true,
  })
  public url!: string;
}
