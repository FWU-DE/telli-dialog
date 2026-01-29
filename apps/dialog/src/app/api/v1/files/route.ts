import { getUser } from '@/auth/utils';
import { TextChunkInsertModel } from '@shared/db/schema';
import { getFileExtension } from '@/utils/files/generic';
import { cnanoid } from '@telli/shared/random/randomService';
import { NextRequest, NextResponse } from 'next/server';
import { extractFile } from '../../file-operations/extract-file';
import { chunkText } from '../../file-operations/process-chunks';
import { embedTextChunks } from '../../file-operations/embedding';
import { logDebug } from '@shared/logging';
import { dbInsertFileWithTextChunks } from '@shared/db/functions/files';
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

  const enrichedChunks: Omit<TextChunkInsertModel, 'embedding'>[] = extractResult.content.flatMap(
    (element) =>
      chunkText({
        text: element.text,
        sentenceChunkOverlap: 1,
        lowerBoundWordCount: 200,
      }).map((chunk, index) => ({
        pageNumber: element.page,
        fileId,
        orderIndex: index,
        content: chunk.content,
        leadingOverlap: chunk.leadingOverlap,
        trailingOverlap: chunk.trailingOverlap,
      })),
  );

  const [textChunks] = await Promise.all([
    embedTextChunks({
      values: enrichedChunks,
      fileId,
      federalStateId: user.federalState.id,
    }),
    // Use processed buffer for images, original buffer for other files
    await uploadMessageAttachment({
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
  };
  await dbInsertFileWithTextChunks(fileModel, textChunks);
  logDebug(`File ${file.name} with type ${fileExtension} stored in db.`);

  return fileId;
}
