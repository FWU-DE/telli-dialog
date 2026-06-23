import { type ToolDefinition, type ToolRegistry } from '@ais-chat/ai-core';
import { UserAndContext } from '@/auth/types';
import type { FileModel, WebSearchResult } from '@shared/db/schema';
import { isWebSearchEnabled } from './websearch';
import { createWebSearchTool } from './build-tools/web-search-tool';
import { createWebScraperTool } from './build-tools/web-scraper-tool';
import { createRetrieveEntireFileTool } from './build-tools/retrieve-entire-file-tool';
import { createRetrieveTextChunksTool } from './build-tools/retrieve-text-chunks-tool';

type BuildToolsParams = {
  user: UserAndContext;
  characterId?: string;
  learningScenarioId?: string;
  assistantId?: string;
  conversationId: string;
  relatedFileEntities: FileModel[];
  sourceUrls?: string[];
  attachedLinks?: string[];
  onWebSearchResults?: (results: WebSearchResult[]) => void;
};

type BuildToolsResult = {
  toolRegistry: ToolRegistry;
  tools: ToolDefinition[];
  toolHandlers: Record<string, (args: Record<string, unknown>) => Promise<string>>;
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
  const toolHandlers: Record<string, (args: Record<string, unknown>) => Promise<string>> = {};
  const webSearchResults: WebSearchResult[] = [];
  const attachedSourceUrls = sourceUrls.length > 0 ? sourceUrls : attachedLinks;

  function addTool(
    definition: ToolDefinition,
    handler: (args: Record<string, unknown>) => Promise<string>,
  ) {
    toolRegistry[definition.name] = {
      definition,
      handler,
    };
    tools.push(definition);
    toolHandlers[definition.name] = handler;
  }
  const webSearchEnabled = await isWebSearchEnabled({
    user,
    characterId,
    learningScenarioId,
    assistantId,
  });

  if (webSearchEnabled) {
    const webSearchTool = createWebSearchTool({
      user,
      conversationId,
      onWebSearchResults,
      webSearchResults,
    });

    addTool(webSearchTool.definition, webSearchTool.handler);
  }

  if (!characterId && !learningScenarioId) {
    const webScraperTool = createWebScraperTool({
      attachedSourceUrls,
    });

    addTool(webScraperTool.definition, webScraperTool.handler);
  }

  if (relatedFileEntities.length > 0) {
    const retrieveEntireFileTool = createRetrieveEntireFileTool({
      relatedFileEntities,
    });

    addTool(retrieveEntireFileTool.definition, retrieveEntireFileTool.handler);
  }

  if (relatedFileEntities.length > 0 || attachedSourceUrls.length > 0) {
    const retrieveTextChunksTool = createRetrieveTextChunksTool({
      user,
      relatedFileEntities,
      attachedSourceUrls,
    });

    addTool(retrieveTextChunksTool.definition, retrieveTextChunksTool.handler);
  }

  return { toolRegistry, tools, toolHandlers, webSearchResults };
}
