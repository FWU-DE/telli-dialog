import { and, eq, gte, sum } from 'drizzle-orm';
import { dbApi } from '.';
import {
  apiKeyTable,
  completionUsageTrackingTable,
  ImageGenerationUsageInsertModel,
  imageGenerationUsageTrackingTable,
  llmModelApiKeyMappingTable,
  llmModelTable,
} from './schema';

export async function dbGetModelById(id: string) {
  return (await dbApi.select().from(llmModelTable).where(eq(llmModelTable.id, id)))[0];
}

export async function dbGetModelsByApiKeyId({ apiKeyId }: { apiKeyId: string }) {
  const rows = await dbApi
    .select()
    .from(llmModelTable)
    .innerJoin(
      llmModelApiKeyMappingTable,
      eq(llmModelApiKeyMappingTable.llmModelId, llmModelTable.id),
    )
    .where(eq(llmModelApiKeyMappingTable.apiKeyId, apiKeyId));

  return rows.map((r) => r.llm_model);
}

export async function dbHasApiKeyAccessToModel({
  apiKeyId,
  modelId,
}: {
  apiKeyId: string;
  modelId: string;
}): Promise<boolean> {
  const rows = await dbApi
    .select()
    .from(llmModelApiKeyMappingTable)
    .where(
      and(
        eq(llmModelApiKeyMappingTable.apiKeyId, apiKeyId),
        eq(llmModelApiKeyMappingTable.llmModelId, modelId),
      ),
    )
    .limit(1);

  return rows.length > 0;
}

export async function dbCreateImageGenerationUsage(
  imageGenerationUsage: ImageGenerationUsageInsertModel,
) {
  const insertedImageGenerationUsage = (
    await dbApi
      .insert(imageGenerationUsageTrackingTable)
      .values({
        ...imageGenerationUsage,
      })
      .returning()
  )[0];

  return insertedImageGenerationUsage;
}

export async function dbGetApiKeyLimit(apiKeyId: string) {
  const apiKey = await dbApi
    .select({ limitInCent: apiKeyTable.limitInCent })
    .from(apiKeyTable)
    .where(eq(apiKeyTable.id, apiKeyId))
    .limit(1);

  return apiKey[0];
}

export async function dbGetCompletionUsageCostsSinceStartOfCurrentMonth({
  apiKeyId,
}: {
  apiKeyId: string;
}) {
  // Get the start of the current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const completionUsage = await dbApi
    .select({ total: sum(completionUsageTrackingTable.costsInCent) })
    .from(completionUsageTrackingTable)
    .where(
      and(
        eq(completionUsageTrackingTable.apiKeyId, apiKeyId),
        gte(completionUsageTrackingTable.createdAt, startOfMonth),
      ),
    );

  return Number(completionUsage[0]?.total || 0);
}

export async function dbGetImageGenerationUsageCostsSinceStartOfCurrentMonth({
  apiKeyId,
}: {
  apiKeyId: string;
}) {
  // Get the start of the current month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const imageUsage = await dbApi
    .select({ total: sum(imageGenerationUsageTrackingTable.costsInCent) })
    .from(imageGenerationUsageTrackingTable)
    .where(
      and(
        eq(imageGenerationUsageTrackingTable.apiKeyId, apiKeyId),
        gte(imageGenerationUsageTrackingTable.createdAt, startOfMonth),
      ),
    );

  return Number(imageUsage[0]?.total || 0);
}
