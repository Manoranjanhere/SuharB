import { BadRequestException } from '@nestjs/common';

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function decodeBase64Image(
  raw: string,
  maxBytes = MAX_IMAGE_BYTES,
): { buffer: Buffer; mimeType: string } {
  const cleaned = raw.replace(/^data:image\/\w+;base64,/, '').trim();
  if (!cleaned) {
    throw new BadRequestException('Empty image data');
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(cleaned, 'base64');
  } catch {
    throw new BadRequestException('Invalid image data');
  }

  if (buffer.length === 0) {
    throw new BadRequestException('Empty image data');
  }
  if (buffer.length > maxBytes) {
    throw new BadRequestException('Image must be under 10MB');
  }

  return { buffer, mimeType: 'image/jpeg' };
}

export function multerFileFromBuffer(
  buffer: Buffer,
  mimeType: string,
  originalname: string,
): Express.Multer.File {
  return {
    buffer,
    mimetype: mimeType,
    originalname,
    size: buffer.length,
  } as Express.Multer.File;
}
