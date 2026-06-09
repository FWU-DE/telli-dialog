import { parseHyperlinks } from '@/utils/web-search/parsing';
import { dbGetLearningScenarioByIdOptionalShareData } from '@shared/db/functions/learning-scenario';
import { dbGetAssistantById } from '@shared/db/functions/assistants';
import { MAX_WEB_SCRAPE_RESULTS_PER_CONVERSATION } from '@/configuration-text-inputs/const';
import { UserAndContext } from '@/auth/types';
import { ChatMessage } from '../chat/actions';
import { dbGetCharacterByIdOptionalShareData } from '@shared/db/functions/character';

// Extract unique URLs from message content
function extractUniqueUrls(content: string): string[] {
  return [...new Set(parseHyperlinks(content) ?? [])].filter((l) => l !== '');
}

// Get attached links from assistant or character
async function getAttachedLinks(
  assistantId: string | undefined,
  characterId: string | undefined,
  learningScenarioId: string | undefined,
  userId: string,
): Promise<string[] | null> {
  if (assistantId) {
    const assistant = await dbGetAssistantById({ assistantId: assistantId });
    return assistant?.attachedLinks.filter((l) => l !== '') ?? [];
  }
  if (characterId) {
    const character = await dbGetCharacterByIdOptionalShareData({
      characterId,
      user: { id: userId },
    });
    return character?.attachedLinks.filter((l) => l !== '') ?? [];
  }
  if (learningScenarioId) {
    const learningScenario = await dbGetLearningScenarioByIdOptionalShareData({
      learningScenarioId,
      user: { id: userId },
    });
    return learningScenario?.attachedLinks.filter((l) => l !== '') ?? [];
  }
  return null;
}

/**
 * Collects URLs based on the conversation context.
 * For characters, only the attached links are returned.
 * For assistants, both attached links and URLs from user messages are included.
 * For regular chat, only URLs from user messages are included.
 *
 * @param assistantId The ID of the assistant, if applicable.
 * @param characterId The ID of the character, if applicable.
 * @param user The user and context information.
 * @param messages The conversation history messages.
 * @returns The aggregated URLs.
 */
export async function extractUrls(
  assistantId: string | undefined,
  characterId: string | undefined,
  learningScenarioId: string | undefined,
  user: UserAndContext,
  messages: ChatMessage[],
): Promise<string[]> {
  const attachedLinks = await getAttachedLinks(
    assistantId,
    characterId,
    learningScenarioId,
    user.id,
  );

  // For characters, just return their attached links
  if (characterId || learningScenarioId) {
    return attachedLinks ?? [];
  }

  const userMessageUrls = [
    ...new Set(
      messages.filter((m) => m.role === 'user').flatMap((m) => extractUniqueUrls(m.content)),
    ),
  ];

  const urls = [...new Set([...(attachedLinks ?? []), ...userMessageUrls])].slice(
    0,
    MAX_WEB_SCRAPE_RESULTS_PER_CONVERSATION,
  );

  return urls;
}
