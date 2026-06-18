import type { Asset } from 'react-native-image-picker';

/** Android gallery often omits type or sends HEIC/jpg aliases. */
export function normalizeImageMimeType(type?: string | null): string {
  if (!type) return 'image/jpeg';
  const lower = type.toLowerCase();
  if (lower === 'image/jpg') return 'image/jpeg';
  if (lower.startsWith('image/')) return lower;
  return 'image/jpeg';
}

export function imageFileNameForUpload(asset: Asset, fallbackBase = 'photo'): string {
  const mime = normalizeImageMimeType(asset.type);
  const ext =
    mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  if (asset.fileName) {
    const base = asset.fileName.replace(/\.[^.]+$/i, '');
    if (base) return `${base}.${ext}`;
  }
  return `${fallbackBase}.${ext}`;
}

export function appendImageToFormData(
  formData: FormData,
  fieldName: string,
  asset: Asset,
  fallbackBase = 'photo',
): void {
  if (!asset.uri) return;
  formData.append(fieldName, {
    uri: asset.uri,
    type: normalizeImageMimeType(asset.type),
    name: imageFileNameForUpload(asset, fallbackBase),
  } as any);
}
