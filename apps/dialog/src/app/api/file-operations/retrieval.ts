import { db } from '@shared/db';
import { FileModelAndContent, fileTable, TextChunkTable } from '@shared/db/schema';
import { and, desc, eq, inArray, SQL, sql } from 'drizzle-orm';
import { chunkText, groupAndSortChunks } from './process-chunks';
import { condenseChatHistory, getKeywordsFromQuery } from '../chat/utils';
import { embedText, embedTextChunks } from './embedding';
import { FILE_SEARCH_LIMIT } from '@/configuration-text-inputs/const';
import { UserAndContext } from '@/auth/types';
import { processFiles } from './process-file';
import { LanguageModelV1, Message } from 'ai';
import { dbInsertFileWithTextChunks } from '@shared/db/functions/files';
import { logWarning } from '@/utils/logging/logging';

type SearchOptions = {
  keywords: string[];
  embedding: number[];
  fileIds?: string[];
  limit?: number;
};

export async function getRelevantFileContent({
  model,
  messages,
  user,
  relatedFileEntities,
}: {
  model: LanguageModelV1;
  messages: Message[];
  user: UserAndContext;
  relatedFileEntities: FileModelAndContent[];
}) {
  if (relatedFileEntities.length === 0) {
    return undefined;
  }

  const [searchQuery, keywords] = await Promise.all([
    condenseChatHistory({
      messages,
      model,
    }),
    getKeywordsFromQuery({
      messages,
      model,
    }),
  ]);

  const [queryEmbedding] = await embedText({
    text: [searchQuery],
    federalStateId: user.federalState.id,
  });

  const relatedFileEntityIds = relatedFileEntities.map((file) => file.id);
  let retrievedTextChunks = await searchTextChunks({
    keywords,
    embedding: queryEmbedding ?? [],
    fileIds: relatedFileEntityIds,
    limit: FILE_SEARCH_LIMIT,
  });

  // Fallback: If no chunks found, process files ad-hoc and try search again
  if (retrievedTextChunks.length === 0) {
    logWarning('No text chunks found, attempting ad-hoc file processing...', {
      relatedFileEntityIds,
    });
    const processedFiles = await processFiles(relatedFileEntities);
    // Process each file that hasn't been processed yet
    await Promise.all(
      processedFiles.map(async (file) => {
        const textChunks = chunkText({
          text: file.content ?? '',
          sentenceChunkOverlap: 1,
          lowerBoundWordCount: 200,
        });

        // Enrich chunks with required properties
        const enrichedChunks = textChunks.map((chunk, index) => ({
          ...chunk,
          fileId: file.id,
          orderIndex: index,
          pageNumber: 0, // Default page number for non-PDF files
        }));

        const chunks = await embedTextChunks({
          values: enrichedChunks,
          fileId: file.id,
          federalStateId: user.federalState.id,
        });
        await dbInsertFileWithTextChunks(
          { id: file.id, name: file.name, size: file.size, type: file.type },
          chunks,
        );
      }),
    );

    // Try search again after processing
    retrievedTextChunks = await searchTextChunks({
      keywords,
      embedding: queryEmbedding ?? [],
      fileIds: relatedFileEntityIds,
      limit: FILE_SEARCH_LIMIT,
    });
  }

  const orderedChunks = groupAndSortChunks(retrievedTextChunks);

  return orderedChunks;
}

/**
 * Search for relevant text chunks using both embedding similarity and full-text search
 * @param options Search parameters including query text, embedding vector, and optional filters
 * @returns Array of text chunks sorted by relevance
 */
export async function searchTextChunks({
  keywords,
  embedding,
  fileIds,
  limit = 10,
}: SearchOptions) {
  // Build the base query
  if (embedding.length === 0) {
    return [];
  }

  const cleaned_keywords = keywords.map((keyword) => keyword.replace(/[^a-zA-Z0-9]/g, ''));
  const embeddingResults = await db
    .select({
      id: TextChunkTable.id,
      content: TextChunkTable.content,
      fileId: TextChunkTable.fileId,
      pageNumber: TextChunkTable.pageNumber,
      fileName: fileTable.name,
      orderIndex: TextChunkTable.orderIndex,
      leadingOverlap: TextChunkTable.leadingOverlap,
      trailingOverlap: TextChunkTable.trailingOverlap,
      // Calculate embedding similarity score (cosine similarity)
      embeddingSimilarity:
        sql`1 - (${TextChunkTable.embedding} <=> ${JSON.stringify(embedding)})` as SQL<number>,
    })
    .from(TextChunkTable)
    .leftJoin(fileTable, eq(TextChunkTable.fileId, fileTable.id))
    .where(inArray(TextChunkTable.fileId, fileIds ?? []))
    .limit(limit)
    .orderBy((t) => [desc(t.embeddingSimilarity)]);

  // Calculate text rank for each chunk see documentation https://orm.drizzle.team/docs/guides/postgresql-full-text-search

  const textRankResults = await db
    .select({
      id: TextChunkTable.id,
      content: TextChunkTable.content,
      fileId: TextChunkTable.fileId,
      fileName: fileTable.name,
      leadingOverlap: TextChunkTable.leadingOverlap,
      trailingOverlap: TextChunkTable.trailingOverlap,
      pageNumber: TextChunkTable.pageNumber,
      orderIndex: TextChunkTable.orderIndex,
      textRank:
        sql`ts_rank_cd(${TextChunkTable.contentTsv}, to_tsquery('german', ${cleaned_keywords.join(' | ')}))` as SQL<number>,
    })
    .from(TextChunkTable)
    .leftJoin(fileTable, eq(TextChunkTable.fileId, fileTable.id))
    .where(
      and(
        inArray(TextChunkTable.fileId, fileIds ?? []),
        sql`ts_rank_cd(${TextChunkTable.contentTsv}, to_tsquery('german', ${cleaned_keywords.join(' | ')})) > 0`,
      ),
    )
    .limit(limit)
    .orderBy((t) => [desc(t.textRank)]);

  // Create a map to store all unique results
  const combinedResultsMap: Map<
    string,
    {
      id: string;
      content: string;
      fileId: string;
      pageNumber: number | null;
      orderIndex: number;
      embeddingRank: number;
      textRank: number;
      combinedRankScore: number;
      fileName: string;
      leadingOverlap: string | null;
      trailingOverlap: string | null;
    }
  > = new Map();

  // Process embedding results with rank position
  embeddingResults.forEach((result, index) => {
    combinedResultsMap.set(result.id, {
      ...result,
      embeddingRank: index + 1, // 1-based rank
      textRank: Number.MAX_SAFE_INTEGER, // Default rank if not in text results
      combinedRankScore: 0, // Will be calculated after both lists are processed
      fileName: result.fileName ?? '',
      leadingOverlap: result.leadingOverlap ?? null,
      trailingOverlap: result.trailingOverlap ?? null,
    });
  });

  // Process text rank results with rank position
  textRankResults.forEach((result, index) => {
    if (combinedResultsMap.has(result.id)) {
      // Update existing entry with text rank position
      const existingEntry = combinedResultsMap.get(result.id);
      if (existingEntry) {
        existingEntry.textRank = index + 1; // 1-based rank
      }
    } else {
      // Add new entry
      combinedResultsMap.set(result.id, {
        ...result,
        embeddingRank: Number.MAX_SAFE_INTEGER, // Default rank if not in embedding results
        textRank: index + 1, // 1-based rank
        combinedRankScore: 0, // Will be calculated after both lists are processed
        fileName: result.fileName ?? '', // Filename must be defined
        leadingOverlap: result.leadingOverlap ?? null,
        trailingOverlap: result.trailingOverlap ?? null,
      });
    }
  });

  // Calculate combined rank score (lower is better)
  for (const entry of combinedResultsMap.values()) {
    // Average of ranks (with equal weighting)
    entry.combinedRankScore = (entry.embeddingRank + entry.textRank) / 2;
  }

  // Convert map to array and sort by combined rank score (lower is better)
  const combinedResults = Array.from(combinedResultsMap.values())
    .sort((a, b) => a.combinedRankScore - b.combinedRankScore)
    .slice(0, limit);

  return combinedResults.slice(0, limit);
}
