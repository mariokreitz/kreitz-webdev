import { sanitizeArgs } from '../utils/sanitize';

describe('sanitizeArgs', () => {
  it('redacts keys matching the default sensitive-key pattern', () => {
    const [result] = sanitizeArgs([{ password: 'hunter2', name: 'ok' }]);

    expect(result).toEqual({ password: '[REDACTED]', name: 'ok' });
  });

  it('redacts keys matching caller-supplied extra keys', () => {
    const [result] = sanitizeArgs([{ ssn: 'ok-already-covered', pin: '1234' }], ['pin']);

    expect(result).toEqual({ ssn: '[REDACTED]', pin: '[REDACTED]' });
  });

  it('truncates long strings', () => {
    const long = 'a'.repeat(600);
    const [result] = sanitizeArgs([long]);

    expect(result).toBe(`${'a'.repeat(500)}...[truncated]`);
  });

  it('leaves short strings untouched', () => {
    const [result] = sanitizeArgs(['short']);

    expect(result).toBe('short');
  });

  it('serializes Date values to ISO strings', () => {
    const date = new Date('2026-01-01T00:00:00.000Z');
    const [result] = sanitizeArgs([date]);

    expect(result).toBe('2026-01-01T00:00:00.000Z');
  });

  it('recurses into arrays', () => {
    const [result] = sanitizeArgs([[{ token: 'secret' }, 'ok']]);

    expect(result).toEqual([{ token: '[REDACTED]' }, 'ok']);
  });

  it('breaks circular object references', () => {
    const circular: Record<string, unknown> = { name: 'a' };
    circular['self'] = circular;

    const [result] = sanitizeArgs([circular]);

    expect(result).toEqual({ name: 'a', self: '[Circular]' });
  });

  it('breaks circular array references', () => {
    const circular: unknown[] = ['a'];
    circular.push(circular);

    const [result] = sanitizeArgs([circular]);

    expect(result).toEqual(['a', '[Circular]']);
  });

  it('passes through primitives and null unchanged', () => {
    expect(sanitizeArgs([1, true, null])).toEqual([1, true, null]);
  });
});
