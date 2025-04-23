import { SUPPORTED_FILE_EXTENSIONS, SUPPORTED_FILE_TYPE } from '@/const';

export function getFileExtension(fileName: string): SUPPORTED_FILE_TYPE {
  const parts = fileName.split('.');

  const lastPart = parts[parts.length - 1];
  if (lastPart === undefined) {
    return fileName;
  }

  if (!SUPPORTED_FILE_EXTENSIONS.includes(lastPart.toString())) {
    throw new Error('file type is not supported or missing');
  }

  return lastPart;
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

export function getFileNameAndFileExtention(fileName:string){
  const parts = fileName.split('.');

  if (parts.length === 1) {
    return fileName;
  }
  const extention = parts[parts.length - 1];
  const fileStem = parts.slice(0, -1).join('.') 
  return [fileStem, extention];

}

export function hexToRGBA(hex: string, opacity = 1) {
  const sanitizedHex = hex.replace('#', '');

  const r = parseInt(sanitizedHex.substring(0, 2), 16);
  const g = parseInt(sanitizedHex.substring(2, 4), 16);
  const b = parseInt(sanitizedHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
