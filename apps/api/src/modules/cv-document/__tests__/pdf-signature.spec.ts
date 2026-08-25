import { hasPdfSignature } from '../utils/pdf-signature';

describe('hasPdfSignature', () => {
  it('returns true for a buffer that starts with the real PDF magic bytes', () => {
    const buffer = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.from('rest of a real pdf body')]);

    expect(hasPdfSignature(buffer)).toBe(true);
  });

  it('returns false for a file renamed to .pdf but whose content is plain text', () => {
    const buffer = Buffer.from('This is just a text file pretending to be a PDF.');

    expect(hasPdfSignature(buffer)).toBe(false);
  });

  it('returns false for a file renamed to .pdf but whose content is a PNG', () => {
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    expect(hasPdfSignature(pngSignature)).toBe(false);
  });

  it('returns false for an empty buffer', () => {
    expect(hasPdfSignature(Buffer.alloc(0))).toBe(false);
  });

  it('returns false for a buffer shorter than the magic byte sequence', () => {
    expect(hasPdfSignature(Buffer.from('%PD'))).toBe(false);
  });

  it('only checks the leading bytes, ignoring what follows the signature', () => {
    const buffer = Buffer.from('%PDF-');

    expect(hasPdfSignature(buffer)).toBe(true);
  });
});
