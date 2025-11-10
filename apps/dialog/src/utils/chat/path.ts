/**
 * Generates the URL path for a conversation based on its context.

 * @param customGptId - Optional custom GPT identifier for custom GPT chat
 * @param characterId - Optional character identifier for character chat
 * @param conversationId - The unique conversation identifier
 * @returns The formatted URL path for the conversation
 */
export function getConversationPath({
  customGptId,
  characterId,
  conversationId,
}: {
  customGptId?: string;
  characterId?: string;
  conversationId: string;
}) {
  if (characterId !== undefined) {
    return `/characters/d/${characterId}/${conversationId}`;
  }

  if (customGptId !== undefined) {
    return `/custom/d/${customGptId}/${conversationId}`;
  }

  return `/d/${conversationId}`;
}
