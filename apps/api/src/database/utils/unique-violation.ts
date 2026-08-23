import { Prisma } from '../../../generated/prisma/client';

export function isUniqueViolationOn(error: unknown, fields: readonly string[]): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
    return false;
  }

  const meta = error.meta;
  const target = meta?.['target'];

  if (Array.isArray(target)) {
    return fields.every((field) => target.includes(field));
  }

  const driverAdapterError = meta?.['driverAdapterError'];
  const cause =
    driverAdapterError && typeof driverAdapterError === 'object' && 'cause' in driverAdapterError
      ? driverAdapterError.cause
      : undefined;
  const constraintFields =
    cause && typeof cause === 'object' && 'constraint' in cause
      ? (cause.constraint as { fields?: unknown } | undefined)?.fields
      : undefined;

  if (Array.isArray(constraintFields)) {
    const normalizedFields = constraintFields.map((field) => String(field).replace(/"/g, ''));

    return fields.every((field) => normalizedFields.includes(field));
  }

  return false;
}
