import { getUser } from '@/auth/utils';
import { getFileExtension } from '@/utils/files/generic';
import { cnanoid } from '@telli/shared/random/randomService';
import { NextRequest, NextResponse } from 'next/server';
import { extractFile } from '../../file-operations/extract-file';
import { chunkAndEmbed } from '../../rag/rag-service';
import { logDebug } from '@shared/logging';
import { dbInsertFileWithChunks } from '@shared/db/functions/files';
import { uploadMessageAttachment } from '@shared/files/fileService';
import { handleErrorInRoute } from '@/error/handle-error-in-route';

/**
 * Handles the POST request to upload a file.
 *
 * This endpoint can be called by any authenticated user.
 * No additional permissions are required.
 * A new fileId is always generated for each upload.
 * It is not possible to overwrite existing files.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (user === undefined) {
      return NextResponse.json({ status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (file === null) {
      return NextResponse.json({ error: 'Could not find file in form data' }, { status: 400 });
    }

    if (typeof file === 'string') {
      return NextResponse.json(
        { error: 'file FormData entry value was of type "string", but expected type "File"' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      body: JSON.stringify({ file_id: await handleFileUpload(file) }),
      status: 200,
    });
  } catch (error) {
    return handleErrorInRoute(error);
  }
}

/**
 * Handles the upload of a file (images and text files).
 * Extracts content, creates chunks and embeddings,
 * uploads file to S3 and stores embeddings in DB.
 *
 * @param file the file to upload
 * @returns the generated fileId of the uploaded file
 */
async function handleFileUpload(file: File) {
  const user = await getUser();
  const fileId = `file_${cnanoid()}`;
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const fileExtension = getFileExtension(file.name);
  const extractResult = await extractFile({
    fileContent: buffer,
    type: fileExtension,
  });

  const [chunks] = await Promise.all([
    chunkAndEmbed({
      textElements: extractResult.content,
      fileId,
      federalStateId: user.federalState.id,
    }),
    uploadMessageAttachment({
      fileId,
      fileExtension,
      buffer: extractResult.processedBuffer || buffer,
    }),
  ]);

  const fileModel = {
    id: fileId,
    name: file.name,
    size: extractResult.processedBuffer ? extractResult.processedBuffer.length : file.size,
    type: fileExtension,
    metadata: extractResult.metadata,
    userId: user.id,
  };
  await dbInsertFileWithChunks(fileModel, chunks);
  logDebug(`File ${file.name} with type ${fileExtension} stored in db.`);

  return fileId;
}
