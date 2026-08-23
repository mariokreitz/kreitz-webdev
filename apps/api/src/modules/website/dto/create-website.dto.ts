import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, Length } from 'class-validator';

export class CreateWebsiteDto {
  @ApiProperty({
    example: 'Kreitz Webdev',
    description: 'Display name of the website',
  })
  @IsString()
  @Length(1, 100)
  public name!: string;

  @ApiProperty({
    example: 'https://www.kreitz-webdev.de/',
    description: 'Public URL of the website',
  })
  @IsUrl({
    require_protocol: true,
  })
  public url!: string;
}
