import { parseHyperlinks } from '@/utils/web-search/parsing';
import { MAX_WEB_SCRAPE_RESULTS_PER_CONVERSATION } from '@/configuration-text-inputs/const';
import { type ChatMessage } from '../chat/actions';
import type {
  AssistantSelectModel,
  CharacterSelectModel,
  LearningScenarioSelectModel,
} from '@shared/db/schema';

// Extract unique URLs from message content
function extractUniqueUrls(content: string): string[] {
  return [...new Set(parseHyperlinks(content) ?? [])].filter((l) => l !== '');
}

function sanitizeLinks(links: string[] | null | undefined): string[] {
  return links?.filter((link) => link !== '') ?? [];
}

/**
 * Collects URLs based on the conversation context.
 * For characters and learning scenarios, only the attached links are returned.
 * For assistants, both attached links and URLs from user messages are included.
 * For regular chat, only URLs from user messages are included.
 *
 * @param assistant The active assistant, if applicable.
 * @param character The active character, if applicable.
 * @param learningScenario The active learning scenario, if applicable.
 * @param messages The conversation history messages.
 * @returns The aggregated URLs.
 */
export function extractUrls({
  assistant,
  character,
  learningScenario,
  messages,
}: {
  assistant?: AssistantSelectModel;
  character?: CharacterSelectModel;
  learningScenario?: LearningScenarioSelectModel;
  messages: ChatMessage[];
}): string[] {
  const attachedLinks = sanitizeLinks(
    assistant?.attachedLinks ?? character?.attachedLinks ?? learningScenario?.attachedLinks,
  );

  // For characters or learning scenarios, just return their attached links
  if (character || learningScenario) {
    return attachedLinks;
  }

  const userMessageUrls = [
    ...new Set(
      messages.filter((m) => m.role === 'user').flatMap((m) => extractUniqueUrls(m.content)),
    ),
  ];

  const urls = [...new Set([...attachedLinks, ...userMessageUrls])].slice(
    0,
    MAX_WEB_SCRAPE_RESULTS_PER_CONVERSATION,
  );

  return urls;
}
