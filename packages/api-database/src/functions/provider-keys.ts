import { and, eq, inArray } from 'drizzle-orm';
import { db } from '../db';
import {
  llmModelProviderKeyMappingTable,
  llmModelTable,
  llmProviderKeyTable,
  type LlmModel,
  type LlmProviderKeyInsertModel,
  type LlmProviderKeyModel,
} from '../schema';

export type LlmProviderKeyWithModels = LlmProviderKeyModel & {
  models: Array<{ model: LlmModel; upstreamModelName: string }>;
};

export async function dbGetAllProviderKeysWithModels(): Promise<LlmProviderKeyWithModels[]> {
  return getProviderKeysWithModels();
}

export async function dbGetProviderKeysWithModelsByOrganizationId(
  organizationId: string,
): Promise<LlmProviderKeyWithModels[]> {
  return getProviderKeysWithModels(organizationId);
}

async function getProviderKeysWithModels(
  organizationId?: string,
): Promise<LlmProviderKeyWithModels[]> {
  const query = db
    .select({
      providerKey: llmProviderKeyTable,
      model: llmModelTable,
      upstreamModelName: llmModelProviderKeyMappingTable.upstreamModelName,
    })
    .from(llmProviderKeyTable)
    .leftJoin(
      llmModelProviderKeyMappingTable,
      eq(llmModelProviderKeyMappingTable.providerKeyId, llmProviderKeyTable.id),
    )
    .leftJoin(llmModelTable, eq(llmModelTable.id, llmModelProviderKeyMappingTable.llmModelId))
    .orderBy(llmProviderKeyTable.createdAt);
  const rows = organizationId
    ? await query.where(eq(llmProviderKeyTable.organizationId, organizationId))
    : await query;
  const keys = new Map<string, LlmProviderKeyWithModels>();

  for (const row of rows) {
    const providerKey = keys.get(row.providerKey.id) ?? { ...row.providerKey, models: [] };
    if (row.model && row.upstreamModelName) {
      providerKey.models.push({ model: row.model, upstreamModelName: row.upstreamModelName });
    }
    keys.set(providerKey.id, providerKey);
  }

  return [...keys.values()];
}

export async function dbCreateProviderKey(providerKey: LlmProviderKeyInsertModel) {
  return (await db.insert(llmProviderKeyTable).values(providerKey).returning())[0];
}

export async function dbUpdateProviderKey(
  id: string,
  organizationId: string,
  providerKey: Partial<LlmProviderKeyModel>,
) {
  return (
    await db
      .update(llmProviderKeyTable)
      .set(providerKey)
      .where(
        and(eq(llmProviderKeyTable.id, id), eq(llmProviderKeyTable.organizationId, organizationId)),
      )
      .returning()
  )[0];
}

export async function dbReplaceProviderKeyModelMappings({
  providerKeyId,
  organizationId,
  models,
}: {
  providerKeyId: string;
  organizationId: string;
  models: Array<{ modelId: string; upstreamModelName: string }>;
}) {
  await db.transaction(async (transaction) => {
    const [providerKey] = await transaction
      .select({ id: llmProviderKeyTable.id })
      .from(llmProviderKeyTable)
      .where(
        and(
          eq(llmProviderKeyTable.id, providerKeyId),
          eq(llmProviderKeyTable.organizationId, organizationId),
        ),
      )
      .limit(1);
    if (!providerKey) throw new Error('Provider key not found');

    const organizationModels = await transaction
      .select({ id: llmModelTable.id })
      .from(llmModelTable)
      .where(eq(llmModelTable.organizationId, organizationId));
    const organizationModelIds = new Set(organizationModels.map(({ id }) => id));
    if (models.some(({ modelId }) => !organizationModelIds.has(modelId))) {
      throw new Error('Provider keys can only be assigned to models in the same organization');
    }

    await transaction
      .delete(llmModelProviderKeyMappingTable)
      .where(eq(llmModelProviderKeyMappingTable.providerKeyId, providerKeyId));
    if (models.length > 0) {
      await transaction.insert(llmModelProviderKeyMappingTable).values(
        models.map(({ modelId, upstreamModelName }) => ({
          providerKeyId,
          llmModelId: modelId,
          upstreamModelName,
        })),
      );
    }
  });
}

export async function dbGetModelIdByProviderAndUpstreamName({
  modelIds,
  provider,
  upstreamModelName,
}: {
  modelIds: string[];
  provider: string;
  upstreamModelName: string;
}): Promise<string | undefined> {
  if (modelIds.length === 0) return undefined;
  const normalizedProvider = provider === 'vertex' ? 'google' : provider;
  const [mapping] = await db
    .select({ modelId: llmModelProviderKeyMappingTable.llmModelId })
    .from(llmModelProviderKeyMappingTable)
    .innerJoin(
      llmProviderKeyTable,
      eq(llmProviderKeyTable.id, llmModelProviderKeyMappingTable.providerKeyId),
    )
    .where(
      and(
        inArray(llmModelProviderKeyMappingTable.llmModelId, modelIds),
        eq(llmModelProviderKeyMappingTable.upstreamModelName, upstreamModelName),
        eq(llmProviderKeyTable.provider, normalizedProvider),
      ),
    )
    .limit(1);
  return mapping?.modelId;
}
