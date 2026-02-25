import { eq, inArray, and } from 'drizzle-orm';
import {
  db,
  dbGetAllApiKeysByProjectId,
  dbGetOrganizationAndProjectsByOrganizationId,
  LlmInsertModel,
  LlmModel,
  llmModelApiKeyMappingTable,
  llmModelTable,
} from '..';

export async function dbGetAllModels() {
  return db.select().from(llmModelTable).orderBy(llmModelTable.createdAt);
}

export async function dbGetModelById(id: string) {
  return (await db.select().from(llmModelTable).where(eq(llmModelTable.id, id)))[0];
}

export async function dbGetAllModelsByOrganizationId(organizationId: string) {
  return await db
    .select()
    .from(llmModelTable)
    .where(eq(llmModelTable.organizationId, organizationId))
    .orderBy(llmModelTable.name, llmModelTable.createdAt);
}

/**
 * Returns the list of llm models linked to the given API key.
 * The deleted flag is ignored for now because telli-dialog needs all models and the deleted flag needs to be mirrored.
 * @param apiKeyId: The id of the API key.
 * @returns
 */
export async function dbGetModelsByApiKeyId({ apiKeyId }: { apiKeyId: string }) {
  const rows = await db
    .select()
    .from(llmModelTable)
    .innerJoin(
      llmModelApiKeyMappingTable,
      eq(llmModelApiKeyMappingTable.llmModelId, llmModelTable.id),
    )
    .where(eq(llmModelApiKeyMappingTable.apiKeyId, apiKeyId));

  return rows.map((r) => r.llm_model);
}

export async function dbCreateLlmModel(llmModel: LlmInsertModel) {
  const modelCreated = await db
    .insert(llmModelTable)
    .values({ ...llmModel })
    .returning();
  return modelCreated[0];
}

export async function dbUpdateLlmModel(
  id: string,
  organizationId: string,
  llmModel: Partial<LlmModel>,
) {
  const updatedModel = (
    await db
      .update(llmModelTable)
      .set({ ...llmModel })
      .where(and(eq(llmModelTable.id, id), eq(llmModelTable.organizationId, organizationId)))
      .returning()
  )[0];

  return updatedModel;
}

export async function dbDeleteLlmModelById(id: string) {
  return (await db.delete(llmModelTable).where(eq(llmModelTable.id, id)).returning())[0];
}

export async function dbGetModelsByIds({ modelIds }: { modelIds: string[] }) {
  if (modelIds.length < 1) return [];

  return await db.select().from(llmModelTable).where(inArray(llmModelTable.id, modelIds));
}

// Helper to get all API keys in an organization
export async function getAllApiKeys(
  organizationId: string,
): Promise<{ id: string; name: string }[]> {
  const orgWithProjects = await dbGetOrganizationAndProjectsByOrganizationId({
    organizationId,
  });
  if (!orgWithProjects) return [];
  const allApiKeys: { id: string; name: string }[] = [];
  for (const project of orgWithProjects.projects) {
    const keys = await dbGetAllApiKeysByProjectId(organizationId, project.id);
    allApiKeys.push(...keys.map((k) => ({ id: k.id, name: k.name })));
  }
  return allApiKeys;
}

export async function dbCreateModelWithApiKeyLinks({
  provider,
  name,
  displayName,
  description = '',
  setting,
  priceMetadata,
  organizationId,
  apiKeyNames,
  isNew,
  isDeleted,
}: LlmInsertModel & { apiKeyNames?: string[] }): Promise<
  | {
      error: string;
    }
  | {
      model: LlmModel;
      linkedApiKeys: { id: string; name: string }[];
    }
> {
  // Check for existing model with same name and provider in the organization
  const existingModel = await db
    .select()
    .from(llmModelTable)
    .where(
      and(
        eq(llmModelTable.name, name),
        eq(llmModelTable.provider, provider),
        eq(llmModelTable.organizationId, organizationId),
      ),
    );
  if (existingModel.length > 0) {
    return {
      error: 'A model with this name and provider already exists for this organization.',
    };
  }

  // Create the model
  const [model] = await db
    .insert(llmModelTable)
    .values({
      provider,
      name,
      displayName,
      description: description ?? '',
      setting,
      priceMetadata,
      organizationId,
      isNew,
      isDeleted,
    })
    .returning();

  if (!model) {
    return { error: 'Failed to create model' };
  }

  const allApiKeys = await getAllApiKeys(organizationId);
  if (!allApiKeys.length) {
    return { error: 'Organization not found' };
  }
  // Find API keys by name
  const apiKeysToLink =
    apiKeyNames
      ?.map((name) => {
        return allApiKeys.find((k) => k.name === name);
      })
      .filter((k) => k !== undefined) ?? allApiKeys;

  if (apiKeysToLink === undefined) {
    return { error: 'One or more API key names not found in organization' };
  }
  // Link model to API keys
  if (apiKeysToLink.length > 0) {
    await db.insert(llmModelApiKeyMappingTable).values(
      apiKeysToLink.map((apiKey) => ({
        llmModelId: model.id,
        apiKeyId: apiKey.id,
      })),
    );
  }

  return {
    model,
    linkedApiKeys: apiKeysToLink,
  };
}
