'use server';

import { dbDeleteConversationByIdAndUserId } from '@/db/functions/conversation';
import { getUser } from '@/auth/utils';
import { dbUpdateConversationTitle } from '@/db/functions/chat';
import { dbUpdateLastUsedModelByUserId } from '@/db/functions/user';
import { revalidatePath } from 'next/cache';

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
