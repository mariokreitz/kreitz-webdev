import { sanitizeCvFileName } from '../utils/sanitize-cv-file-name';

describe('sanitizeCvFileName', () => {
  it('returns a normal file name unchanged', () => {
    expect(sanitizeCvFileName('mario-kreitz-cv.pdf')).toBe('mario-kreitz-cv.pdf');
  });

  it('preserves spaces and dashes', () => {
    expect(sanitizeCvFileName('Mario Kreitz - CV 2026.pdf')).toBe('Mario Kreitz - CV 2026.pdf');
  });

  it('strips CR/LF characters that could inject extra response headers', () => {
    expect(sanitizeCvFileName('cv.pdf\r\nX-Injected: true')).toBe('cv.pdfX-Injected: true');
  });

  it('strips double quotes that could break out of the Content-Disposition filename', () => {
    expect(sanitizeCvFileName('cv".pdf')).toBe('cv.pdf');
  });

  it('strips path separators', () => {
    expect(sanitizeCvFileName('../../etc/passwd.pdf')).toBe('....etcpasswd.pdf');
  });

  it('falls back to a default name when sanitizing leaves nothing usable', () => {
    expect(sanitizeCvFileName('\r\n"')).toBe('cv.pdf');
  });

  it('caps extremely long file names', () => {
    const longName = `${'a'.repeat(300)}.pdf`;

    expect(sanitizeCvFileName(longName).length).toBe(200);
  });
});
