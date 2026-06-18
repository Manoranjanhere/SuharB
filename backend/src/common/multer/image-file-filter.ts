import type { Request } from 'express';

/** Accept gallery picks from Android (often application/octet-stream or empty mimetype). */
export function imageFileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
): void {
  const mime = (file.mimetype || '').toLowerCase();
  const name = (file.originalname || '').toLowerCase();

  const mimeOk =
    /^image\/(jpeg|jpg|png|webp|heic|heif)$/i.test(mime) ||
    mime === 'application/octet-stream' ||
    mime === 'binary/octet-stream' ||
    mime === '';

  const extOk = /\.(jpe?g|png|webp|heic|heif)$/i.test(name);

  if (!mimeOk && !extOk) {
    return cb(new Error('Only JPEG, PNG, WEBP, or HEIC images are allowed'), false);
  }

  if (!mime.startsWith('image/')) {
    if (/\.png$/i.test(name)) file.mimetype = 'image/png';
    else if (/\.webp$/i.test(name)) file.mimetype = 'image/webp';
    else if (/\.(heic|heif)$/i.test(name)) file.mimetype = 'image/heic';
    else file.mimetype = 'image/jpeg';
  }

  cb(null, true);
}
