import { Prisma } from '../../../generated/prisma/client';
import { isUniqueViolationOn } from '../utils/unique-violation';

function buildP2002Error(target: string[]): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { target },
  });
}

describe('isUniqueViolationOn', () => {
  it('returns false for a non-Prisma error', () => {
    expect(isUniqueViolationOn(new Error('boom'), ['slug'])).toBe(false);
  });

  it('returns false for a Prisma error with a different code', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Not found', {
      code: 'P2025',
      clientVersion: 'test',
    });

    expect(isUniqueViolationOn(error, ['slug'])).toBe(false);
  });

  it('returns true when the P2002 target array matches the given fields', () => {
    const error = buildP2002Error(['slug']);

    expect(isUniqueViolationOn(error, ['slug'])).toBe(true);
  });

  it('returns false when the P2002 target array does not include the given field', () => {
    const error = buildP2002Error(['email']);

    expect(isUniqueViolationOn(error, ['slug'])).toBe(false);
  });

  it('matches a compound unique constraint only when all fields are present', () => {
    const error = buildP2002Error(['userId', 'githubId']);

    expect(isUniqueViolationOn(error, ['userId', 'githubId'])).toBe(true);
    expect(isUniqueViolationOn(error, ['userId'])).toBe(true);
    expect(isUniqueViolationOn(error, ['userId', 'somethingElse'])).toBe(false);
  });

  it('reads the driver-adapter constraint fields when meta.target is not an array', () => {
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: 'test',
      meta: {
        driverAdapterError: {
          cause: {
            constraint: { fields: ['"domain"'] },
          },
        },
      },
    });

    expect(isUniqueViolationOn(error, ['domain'])).toBe(true);
  });
});
