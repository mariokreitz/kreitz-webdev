import type { WebsiteRecord } from '@app/database/types/website.repository.types';

import { WebsiteDto } from '../dto/website.dto';

describe('WebsiteDto.fromRecord', () => {
  const record: WebsiteRecord = {
    id: 'website-id',
    userId: 'user-id',
    name: 'Kreitz Webdev',
    slug: 'kreitz-webdev',
    enabled: true,
    contactEmail: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  };

  it('never includes userId in the mapped dto', () => {
    const dto = WebsiteDto.fromRecord(record);

    expect(Object.keys(dto)).not.toContain('userId');
    expect(dto).not.toHaveProperty('userId');
  });

  it('preserves every allow-listed field', () => {
    const dto = WebsiteDto.fromRecord(record);

    expect(dto).toEqual({
      id: record.id,
      name: record.name,
      slug: record.slug,
      enabled: record.enabled,
      contactEmail: record.contactEmail,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  });
});
