export function extractFilenameFromResponse(response: Response, fallbackFileName: string) {
  const encodedFileName = response.headers.get('X-Filename')?.toString();

  return encodedFileName !== undefined ? decodeURIComponent(encodedFileName) : fallbackFileName;
}

export function downloadFileFromBlob(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);

  document.body.appendChild(link);
  link.click();

  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}
