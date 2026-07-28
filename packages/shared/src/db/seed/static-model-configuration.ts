import { asc, eq } from 'drizzle-orm';
import { db } from '..';
import { staticModelConfigurationTable, llmModelTable, StaticModelRole } from '../schema';

const defaultModelNames: Record<StaticModelRole, string> = {
  'default-chat': 'gpt-5-mini',
  fallback: 'gpt-5-nano',
  auxiliary: 'gpt-4o-mini',
  'strong-auxiliary': 'gpt-5.5',
  'auxiliary-fallback': 'meta-llama/Llama-3.3-70B-Instruct',
  'default-image': 'imagen-4.0-generate-001',
};

export async function initializeStaticModelConfigurations() {
  const configurations = await db.select().from(staticModelConfigurationTable);
  const configuredRoles = new Set(configurations.map((configuration) => configuration.role));

  for (const [role, modelName] of Object.entries(defaultModelNames) as [
    StaticModelRole,
    string,
  ][]) {
    if (configuredRoles.has(role)) continue;

    const [model] = await db
      .select({ id: llmModelTable.id })
      .from(llmModelTable)
      .where(eq(llmModelTable.name, modelName))
      .orderBy(asc(llmModelTable.createdAt))
      .limit(1);

    if (model) {
      await db.insert(staticModelConfigurationTable).values({ role, modelId: model.id });
    }
  }
}
