import { eq } from 'drizzle-orm';

import { conversationMessgaeFileMappingTable } from '@/db/schema';

import { deleteFileFromS3 } from '@/s3';
import { db } from '@/db';

export async function cleanUp({ conversationId }: { conversationId: string }) {
  const filesToDelete = (
    await db
      .select({ fileId: conversationMessgaeFileMappingTable.fileId })
      .from(conversationMessgaeFileMappingTable)
      .where(eq(conversationMessgaeFileMappingTable.conversationId, conversationId))
  ).map((f) => f.fileId);

  for (const fileId of filesToDelete) {
    await deleteFileFromS3({ key: fileId });
  }
}
