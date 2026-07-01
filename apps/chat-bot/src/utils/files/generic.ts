import {
  SUPPORTED_DOCUMENTS_EXTENSIONS,
  SUPPORTED_DOCUMENTS_TYPE,
  SUPPORTED_IMAGE_EXTENSIONS,
  SUPPORTED_IMAGE_TYPE,
} from '@/const';

export function getFileExtension(
  fileName: string,
): SUPPORTED_DOCUMENTS_TYPE | SUPPORTED_IMAGE_TYPE {
  const lastPart = fileName.split('.').at(-1);
  const allExtensions: readonly string[] = [
    ...SUPPORTED_DOCUMENTS_EXTENSIONS,
    ...SUPPORTED_IMAGE_EXTENSIONS,
  ];
  if (lastPart === undefined || !allExtensions.includes(lastPart)) {
    throw new Error('file type is not supported or missing');
  }
  return lastPart as SUPPORTED_DOCUMENTS_TYPE | SUPPORTED_IMAGE_TYPE;
}

export function isImageFile(fileName: string): boolean {
  try {
    return SUPPORTED_IMAGE_EXTENSIONS.includes(getFileExtension(fileName));
  } catch {
    return false;
  }
}

export function validateFileExtension(fileName: string): boolean {
  const lastPart = fileName.split('.').at(-1);
  return lastPart !== undefined && SUPPORTED_DOCUMENTS_EXTENSIONS.includes(lastPart);
}

export async function blobToBuffer(blob: Blob) {
  return new Promise<Buffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      resolve(Buffer.from(arrayBuffer));
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1) {
    return '0 B';
  }

  const units: string[] = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const factor: number = 1024;
  let unitIndex = 0;

  while (bytes >= factor && unitIndex < units.length - 1) {
    bytes /= factor;
    unitIndex++;
  }

  // Convert to a string with up to 2 decimal places, removing unnecessary trailing zeros
  const roundedBytes = parseFloat(bytes.toFixed(2)).toString();

  return `${roundedBytes} ${units[unitIndex]}`;
}

export function getFileNameWithoutExtension(fileName: string) {
  const parts = fileName.split('.');

  if (parts.length === 1) {
    return fileName;
  }

  return parts.slice(0, -1).join('.');
}

export function getFileNameAndFileExtension(fileName: string) {
  const parts = fileName.split('.');

  if (parts.length === 1) {
    return fileName;
  }
  const extension = parts[parts.length - 1];
  const fileStem = parts.slice(0, -1).join('.');
  return [fileStem, extension];
}

export function hexToRGBA(hex: string, opacity = 1) {
  const sanitizedHex = hex.replace('#', '');

  const r = parseInt(sanitizedHex.substring(0, 2), 16);
  const g = parseInt(sanitizedHex.substring(2, 4), 16);
  const b = parseInt(sanitizedHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
