import { dbCreateManyTextChunks } from '@/db/functions/text-chunk';
import { OpenAI } from 'openai';
import { embedMany } from 'ai';
import { getModelAndProviderWithResult } from '../utils';
import { dbGetApiKeyByFederalStateIdWithResult } from '@/db/functions/federal-state';
import { env } from '@/env';
import { dbGetModelByIdAndFederalStateId, dbGetModelByName } from '@/db/functions/llm-model';

export async function embedBatchAndSave({
  values,
  fileId,
  federalStateId,
  modelName,
}: {
  values: string[];
  fileId: string;
  federalStateId: string;
  modelName: string;
}) {


  const [error, federalStateObject] = await dbGetApiKeyByFederalStateIdWithResult({
    federalStateId,
  });

  const definedModel = await dbGetModelByName(modelName);

  if (error !== null || definedModel === undefined) {
    if (definedModel === undefined) {
      throw new Error(`Model ${modelName} not found`);
    }
    throw new Error(error?.message ?? 'Error fetching model');
  }

  const client = new OpenAI({
    apiKey: federalStateObject.decryptedApiKey,
    baseURL: `${env.apiUrl}/v1`,
  })


  if (error !== null) {
    throw new Error(error);
  }

  const result = await client.embeddings.create({
    model: definedModel.name,
    input: values,
  });
  console.log(result.data.length)
  await dbCreateManyTextChunks({
    chunks: result.data.map((embedding, index) => ({
      content: values[index] ?? '',
      embedding: embedding.embedding,
      fileId,
      orderIndex: index,
    })),
  });
}
