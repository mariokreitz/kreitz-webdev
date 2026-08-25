export const CV_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
// WHY: this is a hard backstop enforced by multer's own stream-level limit, deliberately looser than CV_MAX_FILE_SIZE_BYTES so the service's own check is what normally produces the user-facing 400; multer's limit only fires on outright abuse and returns 413.
export const CV_MULTER_HARD_LIMIT_BYTES = CV_MAX_FILE_SIZE_BYTES * 2;
export const CV_FILE_FIELD_NAME = 'file';
export const CV_MIME_TYPE = 'application/pdf';
export const CV_FALLBACK_FILE_NAME = 'cv.pdf';
