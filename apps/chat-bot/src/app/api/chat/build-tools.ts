import type { ToolDefinition, ToolRegistry } from '@ais-chat/ai-core';
import type { UserAndContext } from '@/auth/types';
import type { WebSearchResult } from '@shared/db/schema';
import type { FileModelAndContent } from '@shared/db/schema';
import { buildWebSearchTool } from './tools/web-search-tool';
import { buildWebScraperTool } from './tools/web-scraper-tool';
import { buildRetrieveEntireFileTool } from './tools/retrieve-entire-file-tool';
import { buildRetrieveTextChunksTool } from './tools/retrieve-text-chunks-tool';

type BuildToolsParams = {
  user: UserAndContext;
  characterId?: string;
  learningScenarioId?: string;
  assistantId?: string;
  conversationId: string;
  relatedFileEntities: FileModelAndContent[];
  sourceUrls?: string[];
  attachedLinks?: string[];
  onWebSearchResults?: (results: WebSearchResult[]) => void;
};

type BuildToolsResult = {
  toolRegistry: ToolRegistry;
  tools: ToolDefinition[];
  webSearchResults: WebSearchResult[];
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
  const tools: ToolDefinition[] = [];
  const webSearchResults: WebSearchResult[] = [];

  const webSearchTool = await buildWebSearchTool({
    user,
    characterId,
    learningScenarioId,
    assistantId,
    conversationId,
    webSearchResults,
    onWebSearchResults,
  });

  if (webSearchTool) {
    toolRegistry[webSearchTool.definition.name] = webSearchTool;
    tools.push(webSearchTool.definition);
  }

  const webScraperTool = buildWebScraperTool({
    characterId,
    learningScenarioId,
    sourceUrls,
    attachedLinks,
  });

  if (webScraperTool) {
    toolRegistry[webScraperTool.definition.name] = webScraperTool;
    tools.push(webScraperTool.definition);
  }

  const retrieveEntireFileTool = buildRetrieveEntireFileTool({
    relatedFileEntities,
  });

  if (retrieveEntireFileTool) {
    toolRegistry[retrieveEntireFileTool.definition.name] = retrieveEntireFileTool;
    tools.push(retrieveEntireFileTool.definition);
  }

  const retrieveTextChunksTool = buildRetrieveTextChunksTool({
    user,
    relatedFileEntities,
    sourceUrls,
    attachedLinks,
  });

  if (retrieveTextChunksTool) {
    toolRegistry[retrieveTextChunksTool.definition.name] = retrieveTextChunksTool;
    tools.push(retrieveTextChunksTool.definition);
  }

  return { toolRegistry, tools, webSearchResults };
}
