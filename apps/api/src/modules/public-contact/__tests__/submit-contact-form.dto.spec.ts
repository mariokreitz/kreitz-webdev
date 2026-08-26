import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { SubmitContactFormDto } from '../dto/submit-contact-form.dto';

function buildPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: 'Jane Doe',
    email: 'jane@example.com',
    message: 'Hello, I would like to get in touch.',
    ...overrides,
  };
}

async function validatePayload(overrides: Record<string, unknown> = {}): Promise<number> {
  const instance = plainToInstance(SubmitContactFormDto, buildPayload(overrides));
  const errors = await validate(instance);

  return errors.length;
}

describe('SubmitContactFormDto', () => {
  it('accepts a well-formed payload', async () => {
    expect(await validatePayload()).toBe(0);
  });

  it('rejects an empty name', async () => {
    expect(await validatePayload({ name: '' })).toBeGreaterThan(0);
  });

  it('rejects a name over 100 characters', async () => {
    expect(await validatePayload({ name: 'a'.repeat(101) })).toBeGreaterThan(0);
  });

  it('rejects a malformed email', async () => {
    expect(await validatePayload({ email: 'not-an-email' })).toBeGreaterThan(0);
  });

  it('rejects an empty message', async () => {
    expect(await validatePayload({ message: '' })).toBeGreaterThan(0);
  });

  it('rejects a message over 5000 characters', async () => {
    expect(await validatePayload({ message: 'a'.repeat(5001) })).toBeGreaterThan(0);
  });

  it('accepts a message at exactly the 5000 character cap', async () => {
    expect(await validatePayload({ message: 'a'.repeat(5000) })).toBe(0);
  });
});
