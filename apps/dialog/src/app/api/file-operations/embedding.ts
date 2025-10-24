import { dbCreateManyTextChunks } from '@/db/functions/text-chunk';
import { OpenAI } from 'openai';
import { env } from '@/env';
import { dbGetFederalStateWithDecryptedApiKeyWithResult } from '@/db/functions/federal-state';
import { EMBEDDING_BATCH_SIZE } from '@/const';
import { TextChunkInsertModel } from '@/db/schema';
export async function embedText({
  text,
  federalStateId,
}: {
  text: string[];
  federalStateId: string;
}) {
  const [error, federalStateObject] = await dbGetFederalStateWithDecryptedApiKeyWithResult({
    federalStateId,
  });

  if (error !== null || federalStateObject === undefined) {
    throw new Error(error?.message ?? 'Error fetching federal state');
  }

  const client = new OpenAI({
    apiKey: federalStateObject.decryptedApiKey,
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
  let tempChunks: TextChunkInsertModel[] = [];

  console.log(`Embedding ${values.length} chunks`);
  // Process chunks in batches of 200
  for (let i = 0; i < values.length; i += EMBEDDING_BATCH_SIZE) {
    tempChunks = [];
    const batch = values.slice(i, i + EMBEDDING_BATCH_SIZE);
    const batchTexts = batch.map(
      (value) => `${value.leadingOverlap ?? ''}${value.content}${value.trailingOverlap ?? ''}`,
    );

    const batchEmbeddings = await embedText({
      text: batchTexts,
      federalStateId,
    });

    // Add the processed batch to our chunks array
    batchEmbeddings.forEach((embedding, batchIndex) => {
      const originalIndex = i + batchIndex;
      tempChunks.push({
        content: values[originalIndex]?.content ?? '',
        embedding,
        fileId,
        orderIndex: originalIndex,
        pageNumber: values[originalIndex]?.pageNumber ?? 0,
        leadingOverlap: values[originalIndex]?.leadingOverlap ?? undefined,
        trailingOverlap: values[originalIndex]?.trailingOverlap ?? undefined,
      });
    });
    await dbCreateManyTextChunks({
      chunks: tempChunks,
    });
  }
}
