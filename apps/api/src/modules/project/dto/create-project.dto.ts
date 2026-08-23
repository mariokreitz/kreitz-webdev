import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({
    example: 'My awesome project',
  })
  @IsString()
  @MaxLength(200)
  public name!: string;

  @ApiPropertyOptional({
    example: 'A project description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  public description?: string;

  @ApiPropertyOptional({
    example: 'https://github.com/mariokreitz/my-project',
  })
  @IsOptional()
  @IsUrl()
  public url?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/project.png',
  })
  @IsOptional()
  @IsUrl()
  public imageUrl?: string;

  @ApiPropertyOptional({
    example: '123456789',
  })
  @IsOptional()
  @IsString()
  public githubId?: string;

  @ApiPropertyOptional({
    example: 'mariokreitz',
  })
  @IsOptional()
  @IsString()
  public githubOwner?: string;

  @ApiPropertyOptional({
    example: 'my-project',
  })
  @IsOptional()
  @IsString()
  public githubRepo?: string;
}
