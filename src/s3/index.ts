'use server';

import { Readable } from 'stream';

import {
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '@/env';
import { nanoid } from 'nanoid';

const s3Client = new S3Client({
  region: 'eu-de',
  endpoint: `https://${env.otcS3Hostname}`,
  credentials: {
    accessKeyId: env.otcAccessKeyId,
    secretAccessKey: env.otcSecretAccessKey,
  },
});

const BUCKET_NAME = env.otcBucketName;
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
  Bucket = BUCKET_NAME,
}: {
  key: string;
  body: Buffer | Uint8Array | Blob | string | Readable;
  contentType: string;
  Bucket?: string;
}) {
  const Key = key ?? nanoid();
  const uploadParams: PutObjectCommandInput = {
    Bucket,
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

export async function getMaybeSignedUrlFromS3Get({ key }: { key: string | undefined | null }) {
  if (key === undefined || key === null) return undefined;
  return await getSignedUrlFromS3Get({ key });
}

export async function getSignedUrlFromS3Get({
  key,
  filename,
  contentType,
  Bucket = BUCKET_NAME,
  attachment = true,
}: {
  key: string;
  filename?: string;
  contentType?: string;
  attachment?: boolean;
  Bucket?: string;
}) {
  let contentDisposition = attachment ? 'attachment;' : '';
  if (filename !== undefined) {
    contentDisposition = `${contentDisposition} filename=${filename}`;
  }
  const command = new GetObjectCommand({
    Bucket,
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

export async function getSignedUrlFromS3Put({
  key,
  fileType,
  Bucket = BUCKET_NAME,
}: {
  key: string;
  fileType: string;
  Bucket?: string;
}) {
  const command = new PutObjectCommand({
    Bucket,
    Key: key,
    ContentType: fileType,
  });

  try {
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
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
export async function readFileFromS3({
  key,
  Bucket = BUCKET_NAME,
}: {
  key: string;
  Bucket?: string;
}) {
  const getParams: GetObjectCommandInput = {
    Bucket,
    Key: key,
  };

  try {
    const { Body } = await s3Client.send(new GetObjectCommand(getParams));
    const readableStream = Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of readableStream) {
      chunks.push(chunk);
    }
    const content = Buffer.concat(chunks).toString('utf-8');
    return content;
  } catch (error) {
    console.error('Error reading file from S3:', error);
    throw error;
  }
}

export async function streamFileFromS3({
  key,
  Bucket = BUCKET_NAME,
}: {
  key: string;
  Bucket?: string;
}) {
  const getParams: GetObjectCommandInput = {
    Bucket,
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
export async function deleteFileFromS3({
  key,
  Bucket = BUCKET_NAME,
}: {
  key: string;
  Bucket?: string;
}) {
  const deleteParams: DeleteObjectCommandInput = {
    Bucket,
    Key: key,
  };

  try {
    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
    console.log(`File with key ${key} deleted successfully`);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw error;
  }
}
