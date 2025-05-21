'use server';

import { Readable } from 'stream';

import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  CopyObjectCommand,
  CopyObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/env';
import { nanoid } from 'nanoid';

const s3Client = new S3Client({
  // region: 'eu-de',
  region: 'eu-nl',
  endpoint: `https://${env.otcS3Hostname}`,
  credentials: {
    accessKeyId: env.otcAccessKeyId,
    secretAccessKey: env.otcSecretAccessKey,
  },
});

/**
 * Uploads a file to an S3 bucket.
 *
 * @param bucketName - The name of the bucket.
 * @param key - The key (file name) for the uploaded file.
 * @param body - The content to upload.
 * @param contentType - The MIME type of the content.
 * @returns The URL of the uploaded file.
 */
export async function uploadFileToS3({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer | Uint8Array | Blob | string | Readable;
  contentType: string;
}) {
  const Key = key ?? nanoid();
  const uploadParams: PutObjectCommandInput = {
    Bucket: env.otcBucketName,
    Key,
    Body: body,
    ContentType: contentType,
  };

  try {
    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
}

export async function getMaybeLogoFromS3(federalStateId: string | undefined) {
  if (federalStateId === undefined) {
    return undefined;
  }
  const key = `whitelabels/${federalStateId}/logo.jpg`;
  try {
    await s3Client.send(
      new GetObjectCommand({
        Bucket: env.otcBucketName,
        Key: key,
      }),
    );
    return await getSignedUrlFromS3Get({ key });
  } catch (error) {
    return undefined;
  }
}

export async function copyFileInS3({ newKey, copySource }: { newKey: string; copySource: string }) {
  const copyParams: CopyObjectCommandInput = {
    Bucket: env.otcBucketName,
    Key: newKey,
    CopySource: `${env.otcBucketName}/${copySource}`,
  };

  try {
    const command = new CopyObjectCommand(copyParams);
    await s3Client.send(command);
  } catch (error) {
    console.error('Error copying file to S3:', error);
    throw error;
  }
}

export async function getMaybeSignedUrlFromS3Get({ key }: { key: string | undefined | null }) {
  if (key === undefined || key === null || key === '') return undefined;
  return await getSignedUrlFromS3Get({ key });
}

export async function getSignedUrlFromS3Get({
  key,
  filename,
  contentType,
  attachment = true,
}: {
  key: string;
  filename?: string;
  contentType?: string;
  attachment?: boolean;
}) {
  let contentDisposition = attachment ? 'attachment;' : '';
  if (filename !== undefined) {
    contentDisposition = `${contentDisposition} filename=${filename}`;
  }
  const command = new GetObjectCommand({
    Bucket: env.otcBucketName,
    Key: key,
    ...(contentDisposition !== '' ? { ResponseContentDisposition: contentDisposition } : {}),
    ...(contentType !== undefined ? { ResponseContentType: contentType } : {}),
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed GET URL for S3:', error);
    throw error;
  }
}

export async function getSignedUrlFromS3Put({ key, fileType }: { key: string; fileType: string }) {
  const command = new PutObjectCommand({
    Bucket: env.otcBucketName,
    Key: key,
    ContentType: fileType,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
      signableHeaders: new Set([
        'content-type',
        'access-control-allow-header',
        'access-control-allow-origin',
      ]),
    });
    return signedUrl;
  } catch (error) {
    console.error('Error generating signed PUT URL for S3:', error);
    throw error;
  }
}

/**
 * Reads a file from an S3 bucket.
 *
 * @param bucketName - The name of the bucket.
 * @param key - The key (file name) of the file to read.
 * @returns The content of the file as a string.
 */
export async function readFileFromS3({ key }: { key: string }) {
  const getParams: GetObjectCommandInput = {
    Bucket: env.otcBucketName,
    Key: key,
  };

  try {
    const { Body } = await s3Client.send(new GetObjectCommand(getParams));
    const readableStream = Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of readableStream) {
      chunks.push(chunk);
    }
    const content = Buffer.concat(chunks);
    return content;
  } catch (error) {
    console.error('Error reading file from S3:', error);
    throw error;
  }
}

export async function streamFileFromS3({ key }: { key: string }) {
  const getParams: GetObjectCommandInput = {
    Bucket: env.otcBucketName,
    Key: key,
  };

  try {
    const { Body } = await s3Client.send(new GetObjectCommand(getParams));
    return Body;
  } catch (error) {
    console.error('Error reading file from S3:', error);
    throw error;
  }
}

export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
/**
 * Deletes a file from an S3 bucket.
 *
 * @param key - The key (file name) of the file to delete.
 */
export async function deleteFileFromS3({ key }: { key: string }) {
  const deleteParams: DeleteObjectCommandInput = {
    Bucket: env.otcBucketName,
    Key: key,
  };

  try {
    const command = new DeleteObjectCommand(deleteParams);
    const result = await s3Client.send(command);
    console.log(`File with key ${key} deleted successfully`, result);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
}
