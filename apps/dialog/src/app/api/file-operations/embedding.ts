import { dbCreateManyTextChunks } from '@shared/db/functions/text-chunk';
import { OpenAI } from 'openai';
import { env } from '@/env';
import { dbGetFederalStateWithDecryptedApiKeyWithResult } from '@shared/db/functions/federal-state';
import { EMBEDDING_BATCH_SIZE, EMBEDDING_MAX_CONCURRENT_REQUESTS } from '@/const';
import { TextChunkInsertModel } from '@shared/db/schema';
import { logDebug } from '@/utils/logging/logging';

export async function embedText({
  text,
  federalStateId,
}: {
  text: string[];
  federalStateId: string;
}) {
  return await embedTextWithApiKey(text, await getFederalStateApiKey(federalStateId));
}

async function getFederalStateApiKey(federalStateId: string) {
  const [error, federalStateObject] = await dbGetFederalStateWithDecryptedApiKeyWithResult({
    federalStateId,
  });

  if (error !== null || federalStateObject === undefined) {
    throw new Error(error?.message ?? 'Error fetching federal state');
  }

  return federalStateObject.decryptedApiKey;
}

async function embedTextWithApiKey(text: string[], federalStateApiKey: string) {
  const client = new OpenAI({
    apiKey: federalStateApiKey,
    baseURL: `${env.apiUrl}/v1`,
  });
  const result = await client.embeddings.create({
    model: 'BAAI/bge-m3',
    input: text,
  });

  return result.data.map((element) => element.embedding);
}

export async function embedBatchAndSave({
  values,
  fileId,
  federalStateId,
}: {
  values: Omit<TextChunkInsertModel, 'embedding'>[];
  fileId: string;
  federalStateId: string;
}) {
  const federalStateApiKey = await getFederalStateApiKey(federalStateId);

  logDebug(`Embedding ${values.length} chunks`);
  const promises: Promise<void>[] = [];
  // Process chunks in batches of 200
  for (let i = 0; i < values.length; i += EMBEDDING_BATCH_SIZE) {
    promises.push(
      (async () => {
        const batch = values.slice(i, i + EMBEDDING_BATCH_SIZE);
        const batchTexts = batch.map(
          (value) => `${value.leadingOverlap ?? ''}${value.content}${value.trailingOverlap ?? ''}`,
        );

        const batchEmbeddings = await embedTextWithApiKey(batchTexts, federalStateApiKey);

        // Add the processed batch to our chunks array
        const tempChunks = batchEmbeddings.map((embedding, batchIndex) => {
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
        await dbCreateManyTextChunks({
          chunks: tempChunks,
        });
      })(),
    );

    if (promises.length % EMBEDDING_MAX_CONCURRENT_REQUESTS === 0) {
      logDebug('Awaiting embedding API calls due to rate limiting');
      await Promise.all(promises);
    }
  }

  await Promise.all(promises);
}
