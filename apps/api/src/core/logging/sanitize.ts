const DEFAULT_SENSITIVE_KEY_PATTERN =
  /password|token|secret|apikey|authorization|refreshtoken|accesstoken|ssn|creditcard/i;
const MAX_STRING_LENGTH = 500;
const REDACTED = '[REDACTED]';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function truncate(value: string): string {
  return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]` : value;
}

export function sanitizeArgs(args: unknown[], extraKeys?: string[]): unknown[] {
  const seen = new WeakSet<object>();
  const extraKeyPattern =
    extraKeys && extraKeys.length > 0 ? new RegExp(extraKeys.map(escapeRegExp).join('|'), 'i') : undefined;

  function isSensitiveKey(key: string): boolean {
    return DEFAULT_SENSITIVE_KEY_PATTERN.test(key) || (extraKeyPattern?.test(key) ?? false);
  }

  function sanitizeValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return truncate(value);
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (Array.isArray(value)) {
      if (seen.has(value)) {
        return '[Circular]';
      }

      seen.add(value);

      return value.map(sanitizeValue);
    }

    if (value !== null && typeof value === 'object') {
      if (seen.has(value)) {
        return '[Circular]';
      }

      seen.add(value);

      const result: Record<string, unknown> = {};

      for (const [key, entryValue] of Object.entries(value)) {
        result[key] = isSensitiveKey(key) ? REDACTED : sanitizeValue(entryValue);
      }

      return result;
    }

    return value;
  }

  return args.map(sanitizeValue);
}
