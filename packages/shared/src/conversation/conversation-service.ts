import { dbGetConversationById, dbGetCoversationMessages } from '@shared/db/functions/chat';
import { ConversationModel } from '@shared/db/types';
import { ForbiddenError, NotFoundError } from '@shared/error';

/**
 * Get a conversation.
 * A conversation starts with the first message.
 * The conversation always belongs to a user.
 * Throws NotFoundError if the conversation does not exist.
 * Throws ForbiddenError if the user is not the owner of this conversation.
 */
export async function getConversation({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}): Promise<ConversationModel> {
  const conversation = await dbGetConversationById(conversationId);
  if (!conversation) throw new NotFoundError('Conversation not found');
  if (conversation.userId !== userId)
    throw new ForbiddenError('Not authorized to access conversation');

  return conversation;
}

/**
 * Returns the messages of a conversation that belongs to the user.
 */
export async function getConversationMessages({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}) {
  return await dbGetCoversationMessages({
    conversationId,
    userId,
  });
}
