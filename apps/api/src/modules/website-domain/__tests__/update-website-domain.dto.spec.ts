import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { UpdateWebsiteDomainDto } from '../dto/update-website-domain.dto';

describe('UpdateWebsiteDomainDto', () => {
  it('allows an empty body, making domain optional on PATCH', async () => {
    const instance = plainToInstance(UpdateWebsiteDomainDto, {});
    const errors = await validate(instance);

    expect(errors).toHaveLength(0);
    expect(instance.domain).toBeUndefined();
  });

  it('still validates domain when provided', async () => {
    const instance = plainToInstance(UpdateWebsiteDomainDto, { domain: 'not a domain' });
    const errors = await validate(instance);

    expect(errors.length).toBeGreaterThan(0);
  });

  it('normalizes and accepts a valid provided domain', async () => {
    const instance = plainToInstance(UpdateWebsiteDomainDto, { domain: 'https://Mario.DEV/' });
    const errors = await validate(instance);

    expect(errors).toHaveLength(0);
    expect(instance.domain).toBe('mario.dev');
  });
});
