import { dbDeleteOutdatedConversations } from '@shared/db/functions/conversation';
import {
  dbDeleteDanglingFiles,
  dbDeleteFileAndDetachFromConversation,
  dbGetDanglingConversationFileIds,
} from '@shared/db/functions/files';
import { validateApiKeyByHeadersWithResult } from '@/utils/validation';
import { deleteFilesFromS3 } from '@shared/s3';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(req: NextRequest) {
  const [error] = validateApiKeyByHeadersWithResult(req.headers);

  if (error !== null) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }
  const countDeletedConversations = await dbDeleteOutdatedConversations();
  const danglingConversationFiles = await dbGetDanglingConversationFileIds();
  await dbDeleteFileAndDetachFromConversation(danglingConversationFiles);
  // from other entities character, custom gpt, shared school chat
  const danglingFiles = await dbDeleteDanglingFiles();
  await deleteFilesFromS3([...danglingConversationFiles, ...danglingFiles]);
  const response = {
    message: 'Ok',
    countDeletedConversations,
    danglingConversationFiles,
    danglingFiles,
  };

  console.info('Deleted old conversations:', response);

  return NextResponse.json(response, { status: 200 });
}
