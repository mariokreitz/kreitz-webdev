import { CV_FALLBACK_FILE_NAME } from '@app/modules/cv-document/constants/cv-document.constants';

const MAX_FILE_NAME_LENGTH = 200;
// eslint-disable-next-line no-control-regex -- stripping raw control characters (CR/LF) is the point: they can never legitimately appear in a filename and must never reach a response header.
const UNSAFE_CHARS_PATTERN = /[\x00-\x1f"\\/]/g;

export function sanitizeCvFileName(originalName: string): string {
  const sanitized = originalName.replace(UNSAFE_CHARS_PATTERN, '').trim().slice(0, MAX_FILE_NAME_LENGTH);

  return sanitized.length > 0 ? sanitized : CV_FALLBACK_FILE_NAME;
}
