'use server';

import { requireAuth } from '@/auth/requireAuth';
import { getReadOnlySignedUrl } from '@shared/s3';

export async function getReadOnlySignedUrlAction({
  key,
  filename,
  contentType,
  attachment,
  options,
}: {
  key: string | null | undefined;
  filename?: string;
  contentType?: string;
  attachment?: boolean;
  options?: { expiresIn?: number };
}) {
  await requireAuth();
  return getReadOnlySignedUrl({ key, filename, contentType, attachment, options });
}
