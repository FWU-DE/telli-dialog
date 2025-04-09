'use server';

import { dbDeleteConversationByIdAndUserId } from '@/db/functions/conversation';
import { getUser } from '@/auth/utils';
import { dbUpdateConversationTitle } from '@/db/functions/chat';
import { dbUpdateLastUsedModelByUserId } from '@/db/functions/user';
import { revalidatePath } from 'next/cache';
import { dbUpdateUserTermsVersion } from '@/db/functions/user';
import { VERSION } from '@/components/modals/static_content';
import { dbGetRelatedFiles } from '@/db/functions/files';
import { FileModel } from '@/db/schema';

export default async function deleteConversationAction({
  conversationId,
}: {
  conversationId: string;
}) {
  const user = await getUser();

  const deletedConversation = await dbDeleteConversationByIdAndUserId({
    conversationId,
    userId: user.id,
  });

  return deletedConversation;
}

export async function updateConversationNameAction({
  conversationId,
  name,
}: {
  conversationId: string;
  name: string;
}) {
  const user = await getUser();

  dbUpdateConversationTitle({ conversationId, name, userId: user.id });
}

export async function saveChatModelForUserAction(modelName: string) {
  const user = await getUser();
  await dbUpdateLastUsedModelByUserId({ userId: user.id, modelName });
  revalidatePath('/');
}

export async function setUserAcceptConditions(): Promise<boolean> {
  const user = await getUser();
  const updated = await dbUpdateUserTermsVersion({ userId: user.id });
  return updated?.versionAcceptedConditions === VERSION;
}

export async function refetchFileMapping(
  conversationId: string,
): Promise<Map<string, FileModel[]>> {
  const user = await getUser();
  return await dbGetRelatedFiles(conversationId);
}
