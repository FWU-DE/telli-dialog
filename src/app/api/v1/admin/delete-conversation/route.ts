import { dbDeleteOutdatedConversations } from '@/db/functions/conversation';
import {
  dbDeleteDanglingFiles,
  dbDeleteFileAndDetachFromConversation,
  dbGetDanglingFileIds,
} from '@/db/functions/files';
import { validateApiKeyByHeadersWithResult } from '@/db/utils';
import { deleteFileFromS3 } from '@/s3';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest) {
  const [error] = validateApiKeyByHeadersWithResult(req.headers);

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  console.log('ENDPOINT TRIGGERED');
  const count = await dbDeleteOutdatedConversations();
  console.log(count);
  const filesToDelete = (await dbGetDanglingFileIds()).map((file) => file.fileId);
  console.log(filesToDelete);
  await dbDeleteFileAndDetachFromConversation(filesToDelete);
  for (const fileId of filesToDelete) {
    await deleteFileFromS3({ key: fileId });
  }
  await dbDeleteDanglingFiles();
  return NextResponse.json({ message: 'Ok', count }, { status: 200 });
}
