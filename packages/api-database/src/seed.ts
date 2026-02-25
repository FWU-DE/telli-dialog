import { createApiKeyRecord, db } from './index';
import {
  type ApiKeyInsertModel,
  apiKeyTable,
  type LlmInsertModel,
  llmModelApiKeyMappingTable,
  llmModelTable,
  type OrganizationInsertModel,
  organizationTable,
  type ProjectInsertModel,
  projectTable,
} from './schema';
import { eq } from 'drizzle-orm';

const ORGANIZATION_ID = 'cfeb82c6-396a-4c2d-954b-53e77acbbe7e';
const PROJECT_ID = 'test-project-0';
const API_KEY_NAME = 'Test API Key';
// All prices are rough estimates, probably outdated and just for mocking purposes
// Static ids are used to ensure that the models are not created again
// the ids are taken from the staging/production database for interoperability to be able to connect to local telli api or staging
const DEFAULT_MODELS: LlmInsertModel[] = [
  {
    id: 'b870b74d-7458-4dcf-99f6-ace83ef514f4',
    provider: 'ionos',
    name: 'BAAI/bge-m3',
    displayName: 'IONOS BGE M3',
    setting: {
      provider: 'ionos',
      apiKey: 'API_KEY_PLACEHOLDER',
      baseUrl: 'PLACEHOLDER_BASE_URL',
    },
    priceMetadata: {
      type: 'embedding',
      promptTokenPrice: 20, // 0.02 € per 1M tokens,
    },
    organizationId: ORGANIZATION_ID,
  },
  {
    id: '7dcb063f-5241-4846-b11f-a621ea1dd4a9',
    provider: 'ionos',
    name: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
    displayName: 'IONOS Llama 3 8B Instruct',
    description: 'IONOS Llama 3 8B Instruct model for testing',
    setting: {
      provider: 'ionos',
      apiKey: 'API_KEY_PLACEHOLDER',
      baseUrl: 'PLACEHOLDER_BASE_URL',
    },
    priceMetadata: {
      type: 'text',
      promptTokenPrice: 150, // 0.15 € per 1M tokens,
      completionTokenPrice: 250, // 0.25 € per 1M tokens,
    },
    organizationId: ORGANIZATION_ID,
  },
  {
    id: '9578ed80-b0c2-4968-b253-d897576e5512',
    provider: 'azure',
    name: 'gpt-4o-mini',
    displayName: 'OpenAI GPT-4o Mini',
    description: 'OpenAI GPT-4o Mini model for testing',
    setting: {
      provider: 'azure',
      apiKey: 'API_KEY_PLACEHOLDER',
      baseUrl: 'PLACEHOLDER_BASE_URL',
    },
    priceMetadata: {
      type: 'text',
      promptTokenPrice: 165, // 0.165 € per 1M tokens,
      completionTokenPrice: 60, // 0.60 € per 1M tokens,
    },
    organizationId: ORGANIZATION_ID,
  },
];

export async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // 1. Create/update test organization
    // Since there's no unique constraint on name, we'll check if one exists first
    await db
      .insert(organizationTable)
      .values({
        id: ORGANIZATION_ID,
        name: 'Test Organization',
      } satisfies OrganizationInsertModel)
      .onConflictDoNothing()
      .returning();

    // 2. Create/update test project (using primary key for upsert)
    await db
      .insert(projectTable)
      .values({
        id: PROJECT_ID,
        name: 'Test Project',
        organizationId: ORGANIZATION_ID,
      } satisfies ProjectInsertModel)
      .onConflictDoNothing()
      .returning();

    // 3. Create/update test API key
    // Since keyId doesn't have a unique constraint, we'll check first

    let apiKey;
    const { keyId, secretHash, fullKey } = await createApiKeyRecord();

    const [existingApiKey] = await db
      .select()
      .from(apiKeyTable)
      .where(eq(apiKeyTable.name, API_KEY_NAME));

    if (existingApiKey !== undefined) {
      // Update existing API key
      [apiKey] = await db
        .update(apiKeyTable)
        .set({
          name: API_KEY_NAME,
          keyId,
          secretHash,
          projectId: PROJECT_ID,
          limitInCent: 5000,
          state: 'active',
        })
        .where(eq(apiKeyTable.id, existingApiKey.id))
        .returning();
    } else {
      // Create new API key
      [apiKey] = await db
        .insert(apiKeyTable)
        .values({
          name: API_KEY_NAME,
          keyId,
          secretHash,
          projectId: PROJECT_ID,
          limitInCent: 5000, // $50.00 limit per key
          state: 'active',
        } satisfies ApiKeyInsertModel)
        .returning();
    }

    if (apiKey === undefined) {
      throw new Error('Failed to create/update API key');
    }

    // 5. Create/update API key to model mapping
    for (const model of DEFAULT_MODELS) {
      await db.insert(llmModelTable).values(model).onConflictDoNothing().returning();

      await db
        .insert(llmModelApiKeyMappingTable)
        .values({
          llmModelId: model.id!,
          apiKeyId: apiKey.id,
        })
        .onConflictDoNothing();
    }

    // 6. Summary
    console.log('Database seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`   • Organization: Test Organization`);
    console.log(`   • Project: Test Project (ID: ${PROJECT_ID})`);
    console.log(`   • LLM Models: ${DEFAULT_MODELS.map((m) => m.name).join(', ')}`);
    console.log(`   • Model-Key Mapping: configured`);

    console.log('\n Test Credentials:');
    console.log(`   • API Key ID: ${apiKey.keyId}`);

    console.log(`Created API key: ${apiKey?.name} (${apiKey?.keyId})`);
    console.log(`\n SAVE THIS API KEY VALUE IT CANNOT BE VIEWED AGAIN: ${fullKey} \n`);

    console.log('\n⚠️  Remember to replace API key placeholders with real values:');
    console.log(`   • YOUR_IONOS_API_KEY_PLACEHOLDER`);

    return {
      apiKey,
      models: DEFAULT_MODELS,
    };
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
}

try {
  await seedDatabase();
  console.log('Seeding completed');
  process.exit(0);
} catch (error) {
  console.error('Seeding failed:', error);
  process.exit(1);
}
