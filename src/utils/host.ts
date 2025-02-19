import { headers } from 'next/headers';

export async function getHostByHeaders(_headers?: Headers | undefined) {
  const headersList = _headers ?? (await headers());
  return headersList.get('host')?.toString() ?? 'dialog.deutschlandgpt.de';
}

export async function getBaseUrlByHeaders(_headers?: Headers | undefined) {
  const host = await getHostByHeaders(_headers);

  if (host.startsWith('127.0.0.1') || host.startsWith('localhost')) {
    return `http://${host}`;
  }

  return `https://${host}`;
}
