import type { ToolRegistry } from '@ais-chat/ai-core';
import type { UserAndContext } from '@/auth/types';
import type { FileModel, WebSearchResult } from '@shared/db/schema';
import { buildWebSearchTool } from './tools/web-search-tool';
import { buildWebScraperTool } from './tools/web-scraper-tool';
import { buildRetrieveEntireFileTool } from './tools/retrieve-entire-file-tool';
import { buildRetrieveTextChunksTool } from './tools/retrieve-text-chunks-tool';

type BuildToolsParams = {
  user: UserAndContext;
  characterId?: string;
  learningScenarioId?: string;
  assistantId?: string;
  conversationId?: string;
  relatedFileEntities: FileModel[];
  sourceUrls?: string[];
  attachedLinks?: string[];
  onWebSearchResults?: (results: WebSearchResult[]) => void;
};

type BuildToolsResult = {
  toolRegistry: ToolRegistry;
};

export async function buildTools({
  user,
  characterId,
  learningScenarioId,
  assistantId,
  conversationId,
  relatedFileEntities,
  sourceUrls = [],
  attachedLinks = [],
  onWebSearchResults,
}: BuildToolsParams): Promise<BuildToolsResult> {
  const toolRegistry: ToolRegistry = {};

  const webSearchTool = await buildWebSearchTool({
    user,
    characterId,
    learningScenarioId,
    assistantId,
    conversationId,
    onWebSearchResults,
  });

  if (webSearchTool) {
    toolRegistry[webSearchTool.definition.name] = webSearchTool;
  }

  const webScraperTool = buildWebScraperTool({
    characterId,
    learningScenarioId,
    sourceUrls,
    attachedLinks,
  });

  if (webScraperTool) {
    toolRegistry[webScraperTool.definition.name] = webScraperTool;
  }

  const retrieveEntireFileTool = buildRetrieveEntireFileTool({
    relatedFileEntities,
  });

  if (retrieveEntireFileTool) {
    toolRegistry[retrieveEntireFileTool.definition.name] = retrieveEntireFileTool;
  }

  const retrieveTextChunksTool = buildRetrieveTextChunksTool({
    user,
    relatedFileEntities,
    sourceUrls,
    attachedLinks,
  });

  if (retrieveTextChunksTool) {
    toolRegistry[retrieveTextChunksTool.definition.name] = retrieveTextChunksTool;
  }

  return { toolRegistry };
}
