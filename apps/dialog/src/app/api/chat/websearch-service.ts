import { parseHyperlinks } from '@/utils/web-search/parsing';
import { dbGetCharacterByIdWithShareData } from '@shared/db/functions/character';
import { dbGetCustomGptById } from '@shared/db/functions/custom-gpts';
import { ConversationMessageModel, WebsearchSource } from '@shared/db/types';
import { webScraper } from '../webpage-content/search-web';
import { MAX_WEBSEARCH_SOURCES_PER_CONVERSATION } from '@/configuration-text-inputs/const';
import { UserAndContext } from '@/auth/types';
import { type Message } from 'ai';

// Scrape a list of URLs and return their websearch sources
async function scrapeUrls(urls: string[]): Promise<WebsearchSource[]> {
  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        return await webScraper(url);
      } catch {
        return undefined;
      }
    }),
  );
  return results.filter((x): x is WebsearchSource => !!x);
}

// Extract unique URLs from message content
function extractUrls(content: string): string[] {
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
 * Searches the web for relevant content based on the user's message and conversation history.
 * @param customGptId The ID of the custom GPT, if applicable.
 * @param characterId The ID of the character, if applicable.
 * @param user The user and context information.
 * @param userMessage The latest message from the user.
 * @param messages The conversation history messages.
 * @returns An object containing the aggregated websearch sources and those specific to the user's message.
 */
export async function searchWeb(
  customGptId: string | undefined,
  characterId: string | undefined,
  user: UserAndContext,
  userMessage: Message,
  messages: ConversationMessageModel[],
) {
  const attachedLinks = await getAttachedLinks(customGptId, characterId, user.id);

  // For custom GPTs or characters, just scrape their attached links
  if (attachedLinks !== null) {
    const websearchSources = await scrapeUrls(attachedLinks);
    return { websearchSources, userMessageWebsearchSources: [] };
  }

  // For regular conversations, collect existing sources from the db and scrape new URLs
  const existingWebsearchSources = messages
    .filter((m) => m.role === 'user')
    .flatMap((m) => m.websearchSources);

  const remainingSlots = MAX_WEBSEARCH_SOURCES_PER_CONVERSATION - existingWebsearchSources.length;
  if (remainingSlots <= 0) {
    return { websearchSources: existingWebsearchSources, userMessageWebsearchSources: [] };
  }

  // Extract URLs from user message and old messages without websearch sources
  const userMessageUrls = extractUrls(userMessage.content);
  const oldMessageUrls = messages
    .filter((m) => m.role === 'user' && m.websearchSources.length === 0)
    .flatMap((m) => extractUrls(m.content));

  // Scrape user message URLs first (these become userMessageWebsearchSources)
  const uniqueUserMessageUrls = [...new Set(userMessageUrls)].slice(0, remainingSlots);
  const userMessageWebsearchSources = await scrapeUrls(uniqueUserMessageUrls);

  // Scrape old message URLs with remaining slots
  const uniqueOldMessageUrls = [...new Set(oldMessageUrls)]
    .filter((url) => !uniqueUserMessageUrls.includes(url))
    .slice(0, remainingSlots - userMessageWebsearchSources.length);
  const oldMessageWebsearchSources = await scrapeUrls(uniqueOldMessageUrls);

  const websearchSources = [
    ...existingWebsearchSources,
    ...userMessageWebsearchSources,
    ...oldMessageWebsearchSources,
  ].slice(0, MAX_WEBSEARCH_SOURCES_PER_CONVERSATION);

  return { websearchSources, userMessageWebsearchSources };
}
