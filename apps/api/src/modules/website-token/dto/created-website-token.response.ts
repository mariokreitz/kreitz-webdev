import type { WebsiteTokenRecord } from '@app/database/types/website-token.types';
import { ApiProperty } from '@nestjs/swagger';

export class CreatedWebsiteTokenResponse {
  @ApiProperty({ example: 'clx1a2b3c4d5e6f7g8h9' })
  public id!: string;

  @ApiProperty({ example: 'Production Website' })
  public name!: string;

  @ApiProperty({ example: 'wst_live_a3f9x2b1' })
  public prefix!: string;

  @ApiProperty({
    example: 'wst_live_a3f9x2b1QqZ1k7htN2eF9pR4sV6wY8xB0cD2gH4jL6mN8pQ',
    description: 'The plaintext token. Shown exactly once — store it now, it cannot be retrieved again.',
  })
  public token!: string;

  @ApiProperty({ example: '2027-08-23T00:00:00.000Z', nullable: true })
  public expiresAt!: Date | null;

  @ApiProperty({ example: '2026-08-23T12:00:00.000Z' })
  public createdAt!: Date;

  // plaintextToken is passed separately because it is never persisted on the record — it only exists at creation time.
  public static fromRecordAndSecret(token: WebsiteTokenRecord, plaintextToken: string): CreatedWebsiteTokenResponse {
    const response = new CreatedWebsiteTokenResponse();

    response.id = token.id;
    response.name = token.name;
    response.prefix = token.prefix;
    response.token = plaintextToken;
    response.expiresAt = token.expiresAt;
    response.createdAt = token.createdAt;

    return response;
  }
}
