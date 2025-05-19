import { dbCreateManyTextChunks } from '@/db/functions/text-chunk';
import { OpenAI } from 'openai';
import { env } from '@/env';
import { dbGetApiKeyByFederalStateIdWithResult } from '@/db/functions/federal-state';

export async function embedText({
  text,
  federalStateId,
}: {
  text: string[];
  federalStateId: string;
}) {
  const [error, federalStateObject] = await dbGetApiKeyByFederalStateIdWithResult({
    federalStateId,
  });

  if (error !== null || federalStateObject === undefined) {
    throw new Error(error?.message ?? 'Error fetching federal state');
  }

  const client = new OpenAI({
    apiKey: federalStateObject.decryptedApiKey,
    baseURL: `${env.apiUrl}/v1`,
  });
  console.log('text', text);
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
  values: {
    content: string;
    leadingOverlap?: string;
    trailingOverlap?: string;
  }[];
  fileId: string;
  federalStateId: string;
}) {
  const embeddings = await embedText({
    text: values.map(
      (value) => `${value.leadingOverlap ?? ''}${value.content}${value.trailingOverlap ?? ''}`,
    ),
    federalStateId,
  });
  console.log('embeddings', embeddings);
  await dbCreateManyTextChunks({
    chunks: embeddings.map((embedding, index) => ({
      content: values[index]?.content ?? '',
      embedding,
      fileId,
      orderIndex: index,
      leadingOverlap: values[index]?.leadingOverlap ?? undefined,
      trailingOverlap: values[index]?.trailingOverlap ?? undefined,
    })),
  });
}
