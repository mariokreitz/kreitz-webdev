import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class ImportGithubRepoDto {
  @ApiProperty({ example: '123456789' })
  @IsString()
  @MaxLength(50)
  public githubId!: string;

  @ApiProperty({ example: 'mariokreitz' })
  @IsString()
  @MaxLength(200)
  public owner!: string;

  @ApiProperty({ example: 'my-project' })
  @IsString()
  @MaxLength(200)
  public repo!: string;
}
