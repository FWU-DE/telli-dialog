'use server';

import { requireAuth } from '@/auth/requireAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import { uploadAvatarPicture, UploadAvatarPictureParams } from '@shared/files/fileService';

export async function uploadCroppedImage({
  uploadDirPath,
  fileName,
  filePrefix,
  originalFileName,
  croppedImageBlob,
}: UploadAvatarPictureParams) {
  await requireAuth();

  return runServerAction(uploadAvatarPicture)({
    uploadDirPath,
    fileName,
    filePrefix,
    originalFileName,
    croppedImageBlob,
  });
}
