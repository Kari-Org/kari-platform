/**
 * Content-type validation for KYC uploads by "magic number" (the file's leading
 * bytes), not the client-declared multipart type, which is trivially spoofed.
 *
 * A tiny local check on purpose: `file-type` v17+ is ESM-only and does not
 * `require()` cleanly from this CommonJS backend, and we only accept three types.
 */

/** The only content types accepted for a KYC/onboarding document. */
export const ALLOWED_DOCUMENT_TYPES = ['image/jpeg', 'image/png', 'application/pdf'] as const;
export type AllowedDocumentType = (typeof ALLOWED_DOCUMENT_TYPES)[number];

/**
 * Detect the content type from a buffer's leading bytes. Returns the detected
 * allowed type, or null when the bytes are not one of the accepted types.
 */
export function sniffAllowedType(buf: Buffer): AllowedDocumentType | null {
  // JPEG: FF D8 FF
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }
  // PDF: 25 50 44 46 2D  ("%PDF-")
  if (
    buf.length >= 5 &&
    buf[0] === 0x25 &&
    buf[1] === 0x50 &&
    buf[2] === 0x44 &&
    buf[3] === 0x46 &&
    buf[4] === 0x2d
  ) {
    return 'application/pdf';
  }
  return null;
}
