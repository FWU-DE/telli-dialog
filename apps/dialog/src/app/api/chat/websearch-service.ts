import { parseHyperlinks } from '@/utils/web-search/parsing';
import { dbGetCharacterByIdWithShareData } from '@shared/db/functions/character';
import { dbGetCustomGptById } from '@shared/db/functions/custom-gpts';
import { ConversationMessageModel } from '@shared/db/types';
import { MAX_WEBSEARCH_SOURCES_PER_CONVERSATION } from '@/configuration-text-inputs/const';
import { UserAndContext } from '@/auth/types';

// Extract unique URLs from message content
function extractUniqueUrls(content: string): string[] {
  return [...new Set(parseHyperlinks(content) ?? [])].filter((l) => l !== '');
}

// Get attached links from custom GPT or character
async function getAttachedLinks(
  customGptId: string | undefined,
  characterId: string | undefined,
  userId: string,
): Promise<string[] | null> {
  if (customGptId) {
    const customGpt = await dbGetCustomGptById({ customGptId });
    return customGpt?.attachedLinks.filter((l) => l !== '') ?? [];
  }
  if (characterId) {
    const character = await dbGetCharacterByIdWithShareData({ characterId, userId });
    return character?.attachedLinks.filter((l) => l !== '') ?? [];
  }
  return null;
}

/**
 * Extracts URLs from the conversation messages, including any attached links from a custom GPT or character.
 *
 * @param customGptId The ID of the custom GPT, if applicable.
 * @param characterId The ID of the character, if applicable.
 * @param user The user and context information.
 * @param messages The conversation history messages.
 * @returns The aggregated websearch sources.
 */
export async function extractUrls(
  customGptId: string | undefined,
  characterId: string | undefined,
  user: UserAndContext,
  messages: ConversationMessageModel[],
): Promise<string[]> {
  const attachedLinks = await getAttachedLinks(customGptId, characterId, user.id);

  // For custom GPTs or characters, just return their attached links
  if (attachedLinks !== null) {
    return attachedLinks;
  }

  const urls = [
    ...new Set(
      messages.filter((m) => m.role === 'user').flatMap((m) => extractUniqueUrls(m.content)),
    ),
  ].slice(0, MAX_WEBSEARCH_SOURCES_PER_CONVERSATION);

  return urls;
}
