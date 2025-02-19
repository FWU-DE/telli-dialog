'use server';

import { dbDeleteConversationByIdAndUserId } from '@/db/functions/conversation';
import { getUser } from '@/auth/utils';
import { dbUpdateConversationTitle } from '@/db/functions/chat';
import { cookies } from 'next/headers';
import { LAST_USED_MODEL_COOKIE_NAME } from '@/utils/chat/const';

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

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set(LAST_USED_MODEL_COOKIE_NAME, model);
}
