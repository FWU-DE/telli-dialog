import { generateEmbeddingsWithBilling } from '@telli/ai-core';
import { dbGetFederalStateWithDecryptedApiKeyWithResult } from '@shared/db/functions/federal-state';
import { dbGetModelByName } from '@shared/db/functions/llm-model';
import { EMBEDDING_BATCH_SIZE, EMBEDDING_MAX_CONCURRENT_REQUESTS } from '@/const';
import { TextChunkInsertModel } from '@shared/db/schema';
import { logDebug } from '@shared/logging';

const EMBEDDING_MODEL = 'BAAI/bge-m3';

export async function embedText({
  text,
  federalStateId,
}: {
  text: string[];
  federalStateId: string;
}) {
  const [apiKeyId, model] = await Promise.all([
    getFederalStateApiKeyId(federalStateId),
    dbGetModelByName(EMBEDDING_MODEL),
  ]);

  if (!model) {
    throw new Error(`Embedding model ${EMBEDDING_MODEL} not found`);
  }

  return await embedTextWithApiKey(text, model.id, apiKeyId);
}

async function getFederalStateApiKeyId(federalStateId: string) {
  const [error, federalStateObject] = await dbGetFederalStateWithDecryptedApiKeyWithResult({
    federalStateId,
  });

  if (error !== null || federalStateObject === undefined) {
    throw new Error(error?.message ?? 'Error fetching federal state');
  }

  if (federalStateObject.apiKeyId === null) {
    throw new Error('Federal state does not have an associated API key');
  }

  return federalStateObject.apiKeyId;
}

async function embedTextWithApiKey(text: string[], modelId: string, federalStateApiKeyId: string) {
  const result = await generateEmbeddingsWithBilling(
    modelId,
    text,
    federalStateApiKeyId,
  );

  return result.embeddings;
}

export async function embedTextChunks({
  values,
  fileId,
  federalStateId,
}: {
  values: Omit<TextChunkInsertModel, 'embedding'>[];
  fileId: string;
  federalStateId: string;
}): Promise<TextChunkInsertModel[]> {
  const [federalStateApiKeyId, model] = await Promise.all([
    getFederalStateApiKeyId(federalStateId),
    dbGetModelByName(EMBEDDING_MODEL),
  ]);

  if (!model) {
    throw new Error(`Embedding model ${EMBEDDING_MODEL} not found`);
  }

  logDebug(`Embedding ${values.length} chunks`);
  const promises: Promise<TextChunkInsertModel[]>[] = [];
  // Process chunks in batches of 200
  for (let i = 0; i < values.length; i += EMBEDDING_BATCH_SIZE) {
    promises.push(
      (async () => {
        const batch = values.slice(i, i + EMBEDDING_BATCH_SIZE);
        const batchTexts = batch.map(
          (value) => `${value.leadingOverlap ?? ''}${value.content}${value.trailingOverlap ?? ''}`,
        );

        const batchEmbeddings = await embedTextWithApiKey(batchTexts, model.id, federalStateApiKeyId);

        return batchEmbeddings.map((embedding, batchIndex) => {
          const originalIndex = i + batchIndex;
          return {
            content: values[originalIndex]?.content ?? '',
            embedding,
            fileId,
            orderIndex: originalIndex,
            pageNumber: values[originalIndex]?.pageNumber ?? 0,
            leadingOverlap: values[originalIndex]?.leadingOverlap ?? undefined,
            trailingOverlap: values[originalIndex]?.trailingOverlap ?? undefined,
          };
        });
      })(),
    );

    if (promises.length % EMBEDDING_MAX_CONCURRENT_REQUESTS === 0) {
      logDebug('Awaiting embedding API calls due to rate limiting');
      await Promise.all(promises);
    }
  }

  return (await Promise.all(promises)).flat();
}
