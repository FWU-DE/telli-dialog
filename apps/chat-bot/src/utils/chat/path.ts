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
  learningScenarioId,
  conversationId,
}: {
  customGptId?: string;
  characterId?: string;
  learningScenarioId?: string;
  conversationId: string;
}) {
  if (characterId !== undefined) {
    return `/characters/d/${characterId}/${conversationId}`;
  }

  if (learningScenarioId !== undefined) {
    return `/learning-scenarios/d/${learningScenarioId}/${conversationId}`;
  }

  if (customGptId !== undefined) {
    return `/assistants/d/${customGptId}/${conversationId}`;
  }

  return `/d/${conversationId}`;
}
