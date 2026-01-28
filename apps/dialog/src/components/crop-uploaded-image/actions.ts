'use server';

import { requireAuth } from '@/auth/requireAuth';
import { uploadFileToS3 } from '@shared/s3';
import { runServerAction } from '@shared/actions/run-server-action';
import { cnanoid } from '@telli/shared/random/randomService';

type UploadImageToS3Params = {
  uploadDirPath: string;
  fileName?: string;
  filePrefix?: string;
  originalFileName: string;
  croppedImageBlob: Blob;
};

async function uploadCroppedImageToS3Service({
  uploadDirPath,
  fileName,
  filePrefix,
  originalFileName,
  croppedImageBlob,
}: UploadImageToS3Params) {
  const finalFileName = fileName ?? `${filePrefix ?? ''}${cnanoid()}_${originalFileName}`;
  const imagePath = `${uploadDirPath}/${finalFileName}`;

  await uploadFileToS3({
    key: imagePath,
    body: croppedImageBlob,
    contentType: croppedImageBlob.type,
  });

  return { imagePath };
}

export async function uploadCroppedImage({
  uploadDirPath,
  fileName,
  filePrefix,
  originalFileName,
  croppedImageBlob,
}: UploadImageToS3Params) {
  await requireAuth();

  return runServerAction(uploadCroppedImageToS3Service)({
    uploadDirPath,
    fileName,
    filePrefix,
    originalFileName,
    croppedImageBlob,
  });
}
