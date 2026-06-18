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
  const mime = normalizeImageMimeType(asset.type);
  const name = imageFileNameForUpload(asset, fallbackBase);
  formData.append(fieldName, {
    uri: asset.uri,
    type: mime,
    name,
  } as any);
}

export function formatUploadError(
  err: any,
  networkHint = 'Cannot reach the server. Check your connection and try again.',
): string {
  const data = err?.response?.data;
  const msg = data?.message;
  if (msg) {
    return Array.isArray(msg) ? msg.join(', ') : String(msg);
  }
  if (err?.code === 'ECONNABORTED') {
    return 'Upload timed out. Check your connection and try again.';
  }
  if (!err?.response) {
    return networkHint;
  }
  const status = err.response.status as number | undefined;
  if (status === 401) return 'Session expired. Log in again.';
  if (status === 413) return 'Image is too large (max 10MB).';
  if (status && status >= 500) return 'Server error. Try again in a moment.';
  return err?.message || 'Try again';
}
