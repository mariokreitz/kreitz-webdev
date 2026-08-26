export interface PublicCompany {
  readonly id: string;
  readonly name: string;
  readonly role: string | null;
  readonly logoUrl: string | null;
  readonly startDate: string | null;
  readonly endDate: string | null;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

export function isPublicCompany(value: unknown): value is PublicCompany {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const { id, name, role, logoUrl, startDate, endDate } = value as Record<string, unknown>;

  return (
    typeof id === 'string' &&
    typeof name === 'string' &&
    isNullableString(role) &&
    isNullableString(logoUrl) &&
    isNullableString(startDate) &&
    isNullableString(endDate)
  );
}
