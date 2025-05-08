'use server';

import { db } from '@/db';
import { SharedSchoolConversationFileMapping, sharedSchoolConversationTable } from '@/db/schema';
import { getUser } from '@/auth/utils';
import { dbDeleteSharedSchoolChatByIdAndUserId } from '@/db/functions/shared-school-chat';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';
import { dbGetAndUpdateLlmModelsByFederalStateId } from '@/db/functions/llm-model';

export async function dbDeleteSharedChatAction({ id }: { id: string }) {
  const user = await getUser();

  const deletedSharedChat = await dbDeleteSharedSchoolChatByIdAndUserId({
    sharedChatId: id,
    userId: user.id,
  });

  return deletedSharedChat;
}

export async function dbCreateSharedSchoolChat({ userId }: { userId: string }) {
  const user = await getUser();
  const llmModels = await dbGetAndUpdateLlmModelsByFederalStateId({
    federalStateId: user.federalState.id,
  });

  const maybeDefaultModelId =
    llmModels.find((m) => m.name === DEFAULT_CHAT_MODEL)?.id ?? llmModels[0]?.id;

  if (maybeDefaultModelId === undefined) {
    throw new Error('Could not create default shared school chat');
  }

  const [insertedSharedChat] = await db
    .insert(sharedSchoolConversationTable)
    .values({ userId, name: '', modelId: maybeDefaultModelId })
    .returning();
  return insertedSharedChat;
}

export async function linkFileToSharedSchoolChat({
  fileId,
  schoolChatId,
}: {
  fileId: string;
  schoolChatId: string;
}) {
  await getUser();
  const [insertedFileMapping] = await db
    .insert(SharedSchoolConversationFileMapping)
    .values({ sharedSchoolConversationId: schoolChatId, fileId: fileId })
    .returning();
  if (insertedFileMapping === undefined) {
    throw new Error('Could not Link file to shared School Chat');
  }
}
