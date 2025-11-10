import { getUser } from '@/auth/utils';
import { db } from '@shared/db';
import { fileTable, TextChunkInsertModel } from '@shared/db/schema';
import { uploadFileToS3 } from '@shared/s3';
import { getFileExtension } from '@/utils/files/generic';
import { cnanoid } from '@/utils/random';
import { NextRequest, NextResponse } from 'next/server';
import { extractFile } from '../../file-operations/extract-file';
import { chunkText } from '../../file-operations/process-chunks';
import { embedBatchAndSave } from '../../file-operations/embedding';
import { logDebug } from '@/utils/logging/logging';

export async function POST(req: NextRequest) {
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
}

export async function handleFileUpload(file: File) {
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

  await db.insert(fileTable).values({
    id: fileId,
    name: file.name,
    size: extractResult.processedBuffer ? extractResult.processedBuffer.length : file.size,
    type: fileExtension,
    metadata: extractResult.metadata,
  });
  logDebug(`File ${file.name} with type ${fileExtension} stored in db.`);

  await Promise.all([
    embedBatchAndSave({
      values: enrichedChunks,
      fileId,
      federalStateId: user.federalState.id,
    }),
    uploadToS3(file),
  ]);

  return fileId;

  async function uploadToS3(file: File) {
    // Use processed buffer for images, original buffer for other files
    const bufferToUpload = extractResult.processedBuffer || buffer;

    await uploadFileToS3({
      key: `message_attachments/${fileId}`,
      body: bufferToUpload,
      contentType: getFileExtension(file.name),
    });
    logDebug(`File ${file.name} with id ${fileId} uploaded to s3 bucket.`);
  }
}
