import {
  isSupportedDocumentExtension,
  isSupportedFileExtension,
  isSupportedImageExtension,
} from '@/const';

export function getFileExtension(fileName: string) {
  const lastPart = fileName.split('.').at(-1)?.toLowerCase();
  if (lastPart === undefined || !isSupportedFileExtension(lastPart)) {
    throw new Error('file type is not supported or missing');
  }
  return lastPart;
}

export function isImageFile(fileName: string): boolean {
  try {
    return isSupportedImageExtension(getFileExtension(fileName));
  } catch {
    return false;
  }
}

export function validateFileExtension(fileName: string): boolean {
  const lastPart = fileName.split('.').at(-1)?.toLowerCase();
  return lastPart !== undefined && isSupportedDocumentExtension(lastPart);
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

export function getFileNameAndFileExtension(fileName: string): [string, string] {
  const parts = fileName.split('.');

  if (parts.length === 1) {
    return [fileName, ''];
  }
  const extension = parts.at(-1) ?? '';
  const fileStem = parts.slice(0, -1).join('.');
  return [fileStem, extension];
}
