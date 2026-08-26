import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class SubmitContactFormDto {
  @ApiProperty({
    example: 'Jane Doe',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  public name!: string;

  @ApiProperty({
    example: 'jane@example.com',
  })
  @IsEmail()
  public email!: string;

  @ApiProperty({
    example: "Hi, I'd like to discuss a potential project.",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  public message!: string;
}
