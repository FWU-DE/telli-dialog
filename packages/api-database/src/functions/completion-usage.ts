import { db } from '..';
import { CompletionUsageInsertModel, completionUsageTrackingTable, llmModelTable } from '../schema';
import { eq } from 'drizzle-orm';
import {
  calculatePriceInCentByTextModelAndUsage,
  calculatePriceInCentByEmbeddingModelAndUsage,
} from '@telli/api-llm-model';

export async function dbCreateCompletionUsage(completionUsage: CompletionUsageInsertModel) {
  // Get the model to calculate costs
  const model = await db
    .select()
    .from(llmModelTable)
    .where(eq(llmModelTable.id, completionUsage.modelId))
    .limit(1);

  if (model.length === 0) {
    throw new Error(`Model not found: ${completionUsage.modelId}`);
  }

  const modelData = model[0]!;
  let costsInCent = 0;

  // Calculate costs based on model price metadata
  if (modelData.priceMetadata.type === 'text') {
    costsInCent = calculatePriceInCentByTextModelAndUsage({
      priceMetadata: modelData.priceMetadata,
      promptTokens: completionUsage.promptTokens,
      completionTokens: completionUsage.completionTokens,
    });
  } else if (modelData.priceMetadata.type === 'embedding') {
    costsInCent = calculatePriceInCentByEmbeddingModelAndUsage({
      priceMetadata: modelData.priceMetadata,
      promptTokens: completionUsage.promptTokens,
    });
  }

  const insertedCompletionUsage = (
    await db
      .insert(completionUsageTrackingTable)
      .values({
        ...completionUsage,
        costsInCent,
      })
      .returning()
  )[0];

  return insertedCompletionUsage;
}
