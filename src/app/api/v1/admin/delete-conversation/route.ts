import { dbDeleteOutdatedConversations } from '@/db/functions/conversation';
import {
  dbDeleteDanglingFiles,
  dbDeleteFileAndDetachFromConversation,
  dbGetDanglingConversationFileIds,
} from '@/db/functions/files';
import { validateApiKeyByHeadersWithResult } from '@/db/utils';
import { deleteFileFromS3 } from '@/s3';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest) {
  const [error] = validateApiKeyByHeadersWithResult(req.headers);

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  const count = await dbDeleteOutdatedConversations();
  const danglingConversationFiles = (await dbGetDanglingConversationFileIds()).map(
    (file) => file.fileId,
  );
  await dbDeleteFileAndDetachFromConversation(danglingConversationFiles);
  const danglingFiles = await dbDeleteDanglingFiles();
  for (const fileId of [...danglingConversationFiles, ...danglingFiles]) {
    await deleteFileFromS3({ key: fileId });
  }
  return NextResponse.json({ message: 'Ok', count }, { status: 200 });
}
