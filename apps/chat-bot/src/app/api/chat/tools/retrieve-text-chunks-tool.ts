import { VECTOR_SEARCH_LIMIT } from '@/configuration-text-inputs/const';
import { ingestWebContent } from '../../rag/ingestWebContent';
import { retrieveChunksByQuery } from '../../rag/rag-service';
import type { BuildToolsContext, ToolDefinition, ToolRegistration } from './types';

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
    response.error = 'No matching chunks found.';
  }

  return JSON.stringify(response);
}

type BuildRetrieveTextChunksToolParams = Pick<
  BuildToolsContext,
  'user' | 'relatedFileEntities' | 'sourceUrls' | 'attachedLinks'
>;

export function buildRetrieveTextChunksTool({
  user,
  relatedFileEntities,
  sourceUrls,
  attachedLinks,
}: BuildRetrieveTextChunksToolParams): ToolRegistration | null {
  const attachedSourceUrls = sourceUrls.length > 0 ? sourceUrls : attachedLinks;

  if (relatedFileEntities.length === 0 && attachedSourceUrls.length === 0) {
    return null;
  }

  const attachedFileDescriptions = relatedFileEntities.map(
    (file) => `${file.name} (${file.size} bytes)`,
  );

  const definition: ToolDefinition = {
    name: 'retrieve_text_chunks',
    description: `Retrieve relevant text chunks from the attached sources. Available files right now: ${attachedFileDescriptions.join(', ') || 'none'}. Available linked pages right now: ${attachedSourceUrls.join(', ') || 'none'}. Use this tool when you need exact passages from the files or linked pages or want to inspect a specific topic inside the available sources. Returns up to ${VECTOR_SEARCH_LIMIT} chunks per call. Call it with a short, specific search string in the same language as the user.`,
    parameters: {
      type: 'object',
      properties: {
        search: {
          type: 'string',
          description:
            'A concise search string that captures the exact topic or passage you want to retrieve.',
        },
      },
      required: ['search'],
      additionalProperties: false,
    },
  };

  const handler = async (args: Record<string, unknown>) => {
    let processedSourceUrls = attachedSourceUrls;

    if (attachedSourceUrls.length > 0) {
      const { processedUrls } = await ingestWebContent({
        urls: attachedSourceUrls,
        federalStateId: user.federalState.id,
      });

      processedSourceUrls = processedUrls;
    }
    const search = typeof args.search === 'string' ? args.search : '';
    const chunks = await retrieveChunksByQuery({
      searchQuery: search,
      federalStateId: user.federalState.id,
      relatedFileEntities,
      sourceUrls: processedSourceUrls,
      limit: VECTOR_SEARCH_LIMIT,
    });

    return formatRetrievedChunksForTool(chunks);
  };

  return { definition, handler };
}
