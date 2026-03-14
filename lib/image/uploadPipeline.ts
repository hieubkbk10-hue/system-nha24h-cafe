export const WEBP_UPLOAD_QUALITY = 0.85;

const DEFAULT_MAX_FILE_SIZE_MB = 10;

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/gif': 'gif',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

type PrepareImageOptions = {
  quality?: number;
  preserveGif?: boolean;
  preservePngWithTransparency?: boolean;
};

export type PreparedUploadImage = {
  file: File;
  filename: string;
  height: number;
  mimeType: string;
  originalSize: number;
  size: number;
  width: number;
};

function slugify(value: string): string {
  const normalized = value
    .toLowerCase()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '')
    .replaceAll(/[đĐ]/g, 'd')
    .replaceAll(/[^a-z0-9\s-]/g, '')
    .replaceAll(/\s+/g, '-')
    .replaceAll(/-+/g, '-')
    .trim();

  return normalized || 'image';
}

function getExtensionFromMime(mimeType: string): string {
  return MIME_EXTENSION_MAP[mimeType] ?? 'bin';
}

function buildFilename(originalName: string, mimeType: string): string {
  const baseName = originalName.replace(/\.[^/.]+$/, '');
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 6);
  const ext = getExtensionFromMime(mimeType);
  return `${slugify(baseName)}-${timestamp}-${random}.${ext}`;
}

async function getImageDimensions(file: File): Promise<{ height: number; width: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const width = img.width;
      const height = img.height;
      URL.revokeObjectURL(objectUrl);
      resolve({ height, width });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Không thể đọc kích thước ảnh'));
    };

    img.src = objectUrl;
  });
}

async function hasTransparency(file: File): Promise<boolean> {
  if (file.type !== 'image/png') {
    return false;
  }

  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        resolve(true);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) {
          URL.revokeObjectURL(objectUrl);
          resolve(true);
          return;
        }
      }

      URL.revokeObjectURL(objectUrl);
      resolve(false);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(true);
    };

    img.src = objectUrl;
  });
}

async function convertToWebP(file: File, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        resolve(blob);
      }, 'image/webp', quality);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };

    img.src = objectUrl;
  });
}

export function validateImageFile(file: File, maxFileSizeMb: number = DEFAULT_MAX_FILE_SIZE_MB): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Vui lòng chọn file hình ảnh';
  }

  if (file.size > maxFileSizeMb * 1024 * 1024) {
    return `Kích thước file không được vượt quá ${maxFileSizeMb}MB`;
  }

  return null;
}

export async function prepareImageForUpload(
  file: File,
  options: PrepareImageOptions = {}
): Promise<PreparedUploadImage> {
  const quality = options.quality ?? WEBP_UPLOAD_QUALITY;
  const preserveGif = options.preserveGif ?? true;
  const preservePngWithTransparency = options.preservePngWithTransparency ?? true;

  const dimensions = await getImageDimensions(file);

  let targetMimeType = file.type;
  let targetBlob: Blob = file;

  const isGif = file.type === 'image/gif';
  const isPng = file.type === 'image/png';
  const isSvg = file.type === 'image/svg+xml';

  const shouldKeepGif = preserveGif && isGif;
  const shouldKeepPng = preservePngWithTransparency && isPng && await hasTransparency(file);
  const shouldKeepOriginal = shouldKeepGif || shouldKeepPng || isSvg;

  if (!shouldKeepOriginal) {
    const webpBlob = await convertToWebP(file, quality);
    if (webpBlob) {
      targetBlob = webpBlob;
      targetMimeType = 'image/webp';
    }
  }

  const filename = buildFilename(file.name, targetMimeType);
  const uploadFile = new File([targetBlob], filename, { type: targetMimeType });

  return {
    file: uploadFile,
    filename,
    height: dimensions.height,
    mimeType: targetMimeType,
    originalSize: file.size,
    size: uploadFile.size,
    width: dimensions.width,
  };
}
