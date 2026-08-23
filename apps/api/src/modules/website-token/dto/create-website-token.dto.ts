import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWebsiteTokenDto {
  @ApiProperty({
    example: 'Production Website',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  public name!: string;

  @ApiProperty({
    example: '2027-08-23T00:00:00.000Z',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  public expiresAt?: string;
}
