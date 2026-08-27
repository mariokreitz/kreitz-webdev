export interface CvRequestContext {
  readonly cvAvailable: boolean;
}

export function asCvRequestContext(value: unknown): CvRequestContext | null {
  if (value === null || typeof value !== 'object') {
    return null;
  }

  const { cvAvailable } = value as Record<string, unknown>;

  return typeof cvAvailable === 'boolean' ? { cvAvailable } : null;
}
