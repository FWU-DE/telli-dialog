import {
  dbGetConversationById,
  dbGetConversationMessages,
  dbUpdateConversationTitle,
} from '@shared/db/functions/chat';
import { dbDeleteConversationByIdAndUserId } from '@shared/db/functions/conversation';
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
  return await dbGetConversationMessages({
    conversationId,
    userId,
  });
}

/**
 * Deletes a conversation that belongs to the user.
 * Throws an error if the conversation could not be deleted.
 */
export default async function deleteConversation({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}) {
  await dbDeleteConversationByIdAndUserId({
    conversationId,
    userId,
  });
}

/**
 *  Triggered by the user if they want to update the name of a conversation.
 *  Throws a NotFoundError if the conversation does not exist or the user is not the owner.
 **/
export async function updateConversationTitle({
  conversationId,
  name,
  userId,
}: {
  conversationId: string;
  name: string;
  userId: string;
}) {
  const result = dbUpdateConversationTitle({ conversationId, name, userId });
  if (!result) {
    throw new NotFoundError('Could not update conversation title');
  }
  return result;
}

/**
 * User wants to download a conversation.
 * Verifies that the conversation belongs to the user
 * and returns the conversation and messages for export.
 *
 */
export async function getConversationAndMessagesForExport({
  conversationId,
  userId,
}: {
  conversationId: string;
  userId: string;
}) {
  const conversation = await getConversation({ conversationId, userId });
  const messages = await getConversationMessages({ conversationId, userId });

  return {
    conversation,
    messages,
  };
}
