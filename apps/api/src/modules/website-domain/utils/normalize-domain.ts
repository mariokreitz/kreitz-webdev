export function normalizeDomain(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/[/?#].*$/, '')
    .replace(/:\d+$/, '')
    .replace(/\.$/, '');
}
