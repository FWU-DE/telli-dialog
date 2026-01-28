'use server';

import { Readable } from 'stream';

import {
  CopyObjectCommand,
  CopyObjectCommandInput,
  DeleteObjectCommand,
  DeleteObjectCommandInput,
  DeleteObjectsCommand,
  DeleteObjectsCommandInput,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListObjectsV2CommandInput,
  PutObjectCommand,
  PutObjectCommandInput,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';
import { nanoid } from 'nanoid';
import { chunkArray } from '@shared/utils/arrays';
import { S3_DELETE_OBJECTS_MAX } from '@shared/s3/const';

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
 * @param key - The key (file name) for the uploaded file.
 * @param body - The content to upload.
 * @param contentType - The MIME type of the content.
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
  const uploadParams: PutObjectCommandInput = {
    Bucket: env.otcBucketName,
    Key: key ?? nanoid(),
    Body: body,
    ContentType: contentType,
  };

  const command = new PutObjectCommand(uploadParams);
  await s3Client.send(command);
}

export async function getMaybeLogoFromS3(federalStateId: string | undefined, asset: string) {
  if (federalStateId === undefined) {
    return undefined;
  }
  return await getMaybeSignedUrlIfExists({
    key: `whitelabels/${federalStateId}/${asset}`,
    suppressError: true,
  });
}

/**
 * Copies an existing object in S3 from the `copySource` key to the `newKey`.
 * @param newKey the new key
 * @param copySource the existing key to copy
 */
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
 * Deletes a file from an S3 bucket.
 * CAUTION: the result is always status 204 even if the file did not exist.
 * @param key - The key (path and file name) of the file to delete.
 */
export async function deleteFileFromS3({ key }: { key: string }) {
  const deleteParams: DeleteObjectCommandInput = {
    Bucket: env.otcBucketName,
    Key: key,
  };

  const command = new DeleteObjectCommand(deleteParams);
  await s3Client.send(command);
}

/**
 * Deletes multiple files from an S3 bucket.
 *
 * @param keys The keys (file name) of the files to delete.
 */
export async function deleteFilesFromS3(keys: string[]) {
  if (keys.length === 0) {
    return;
  }

  const uniqueKeys = [...new Set(keys)];
  const chunks = chunkArray(uniqueKeys, S3_DELETE_OBJECTS_MAX);
  await Promise.all(
    chunks.map(async (chunkedKeys) => {
      const deleteParams: DeleteObjectsCommandInput = {
        Bucket: env.otcBucketName,
        Delete: {
          Objects: chunkedKeys.map((key) => ({ Key: key })),
          Quiet: true,
        },
      };

      try {
        const command = new DeleteObjectsCommand(deleteParams);
        const result = await s3Client.send(command);
        console.log('Files deleted successfully from S3:', result);
      } catch (error) {
        console.error('Error deleting files from S3:', error);
        throw error;
      }
    }),
  );
}

async function getMaybeSignedUrlIfExists({
  key,
  filename,
  contentType,
  attachment = true,
  suppressError = false,
}: {
  key?: string | null;
  filename?: string;
  contentType?: string;
  attachment?: boolean;
  suppressError?: boolean;
}) {
  if (key === undefined || key === null || key === '') return undefined;
  // Todo: unstable_cache from next was used here with revalidate of 3000 seconds
  try {
    // Check if the object exists by attempting to get its metadata
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: env.otcBucketName,
        Key: key,
      }),
    );

    // If no error is thrown, the object exists, so generate the signed URL
    return await getSignedUrlFromS3Get({ key, filename, contentType, attachment });
  } catch (error) {
    if (!suppressError) {
      console.error('Error getting signed URL from S3:', error);
    }
    // If an error is thrown, the object doesn't exist
    return undefined;
  }
}

/**
 * Lists all files in an S3 bucket with optional prefix filtering.
 *
 * @param prefix Optional prefix to filter objects (e.g., 'folder/subfolder/')
 * @param maxKeys Maximum number of keys to return per page (default: 1000)
 * @returns Array of objects keys
 */
export async function listFilesFromS3({
  prefix,
}: {
  prefix?: string;
} = {}) {
  const allObjects: string[] = [];
  let continuationToken: string | undefined = undefined;

  do {
    const listParams: ListObjectsV2CommandInput = {
      Bucket: env.otcBucketName,
      Prefix: prefix,
      MaxKeys: 1_000,
      ContinuationToken: continuationToken,
    };
    const command = new ListObjectsV2Command(listParams);
    const response = await s3Client.send(command);

    if (response.Contents) {
      const keys = response.Contents.map((x) => x.Key).filter(
        // Exclude folders, their keys end with '/'
        (x): x is string => !!x && !x.endsWith('/'),
      );
      allObjects.push(...keys);
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return allObjects;
}
