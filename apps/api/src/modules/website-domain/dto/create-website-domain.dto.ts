import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Matches } from 'class-validator';

const DOMAIN_PATTERN = /^(localhost|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59}))$/;

export function normalizeDomain(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '');
}

export class CreateWebsiteDomainDto {
  @ApiProperty({
    example: 'mario.dev',
    description:
      "Bare hostname to register — no scheme, path, or port (e.g. 'mario.dev', not 'https://mario.dev/'). " +
      "The literal 'localhost' is also accepted for local development.",
  })
  @Transform(({ value }) => normalizeDomain(value))
  @IsString()
  @Matches(DOMAIN_PATTERN, {
    message: 'domain must be a valid hostname (e.g. "mario.dev") or "localhost", without scheme, path, or port',
  })
  public domain!: string;
}
