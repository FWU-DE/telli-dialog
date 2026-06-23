import type { ToolDefinition } from '@ais-chat/ai-core';
import type { FileModel } from '@shared/db/schema';
import type { UserAndContext } from '@/auth/types';
import { VECTOR_SEARCH_LIMIT } from '@/configuration-text-inputs/const';
import { ingestWebContent } from '../../rag/ingestWebContent';
import { retrieveChunksByQuery } from '../../rag/rag-service';
import type { ToolHandler } from './types';

type SemanticFileSearchChunkResult = {
  fileName: string | null;
  orderIndex: number | null;
  content: string | null;
};

type SemanticFileSearchToolResponse = {
  chunks: SemanticFileSearchChunkResult[];
  error: string | null;
};

function formatRetrievedChunksForTool(chunks: Awaited<ReturnType<typeof retrieveChunksByQuery>>) {
  const formattedChunks: SemanticFileSearchChunkResult[] = chunks.map((chunk) => ({
    fileName: chunk.fileName ?? null,
    orderIndex: chunk.orderIndex ?? null,
    content: chunk.content ?? null,
  }));

  const response: SemanticFileSearchToolResponse = {
    chunks: formattedChunks,
    error: null,
  };

  if (chunks.length === 0) {
    response.error = 'Keine passenden Textstellen gefunden.';
  }

  return JSON.stringify(response);
}

type CreateRetrieveTextChunksToolParams = {
  user: UserAndContext;
  relatedFileEntities: FileModel[];
  attachedSourceUrls: string[];
};

export function createRetrieveTextChunksTool({
  user,
  relatedFileEntities,
  attachedSourceUrls,
}: CreateRetrieveTextChunksToolParams): { definition: ToolDefinition; handler: ToolHandler } {
  const attachedFileDescriptions = relatedFileEntities.map(
    (file) => `${file.name} (${file.size} bytes)`,
  );

  const definition: ToolDefinition = {
    name: 'retrieve_text_chunks',
    description: `Retrieve relevant text chunks from the attached sources. Available files right now: ${attachedFileDescriptions.join(', ') || 'none'}. Available linked pages right now: ${attachedSourceUrls.join(', ') || 'none'}. Use this tool when you need exact passages from the files or linked pages or want to inspect a specific topic inside the available sources. You can request up to ${VECTOR_SEARCH_LIMIT} chunks per call. Call it with a short, specific search string in the same language as the user.`,
    parameters: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description:
            'A concise search string that captures the exact topic or passage you want to retrieve.',
        },
        limit: {
          type: 'integer',
          minimum: 1,
          maximum: VECTOR_SEARCH_LIMIT,
          description:
            'Optional number of chunks to return. Values outside the allowed range are clamped.',
        },
      },
      required: ['search', 'limit'],
      additionalProperties: false,
    },
  };

  const handler: ToolHandler = async (args) => {
    let processedSourceUrls = attachedSourceUrls;

    if (attachedSourceUrls.length > 0) {
      const { processedUrls } = await ingestWebContent({
        urls: attachedSourceUrls,
        federalStateId: user.federalState.id,
      });

      processedSourceUrls = processedUrls;
    }
    const search = typeof args.search === 'string' ? args.search : '';
    const requestedLimit =
      typeof args.limit === 'number' && Number.isFinite(args.limit)
        ? Math.trunc(args.limit)
        : VECTOR_SEARCH_LIMIT;
    const limit = Math.min(Math.max(requestedLimit, 1), VECTOR_SEARCH_LIMIT);
    const chunks = await retrieveChunksByQuery({
      searchQuery: search,
      federalStateId: user.federalState.id,
      relatedFileEntities,
      sourceUrls: processedSourceUrls,
      limit,
    });

    return formatRetrievedChunksForTool(chunks);
  };

  return {
    definition,
    handler,
  };
}
