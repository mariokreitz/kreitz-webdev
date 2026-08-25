const PDF_MAGIC_BYTES = Buffer.from('%PDF-', 'ascii');

export function hasPdfSignature(buffer: Buffer): boolean {
  if (buffer.length < PDF_MAGIC_BYTES.length) {
    return false;
  }

  return buffer.subarray(0, PDF_MAGIC_BYTES.length).equals(PDF_MAGIC_BYTES);
}
