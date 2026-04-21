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
const PROJECT_ID = 'DE-TEST';
const API_KEY_NAME = 'Test API Key';

// LLM provider keys: use real values from env (CI) or placeholders (local dev)
const ionosApiKey = process.env.LLM_IONOS_API_KEY ?? 'API_KEY_PLACEHOLDER';
const ionosBaseUrl = process.env.LLM_IONOS_BASE_URL ?? 'PLACEHOLDER_BASE_URL';
const gpt4oMiniApiKey = process.env.LLM_GPT4OMINI_API_KEY ?? 'API_KEY_PLACEHOLDER';
const gpt4oMiniBaseUrl = process.env.LLM_GPT4OMINI_BASE_URL ?? 'PLACEHOLDER_BASE_URL';
const gpt5nanoApiKey = process.env.LLM_GPT5NANO_API_KEY ?? 'API_KEY_PLACEHOLDER';
const gpt5nanoBaseUrl = process.env.LLM_GPT5NANO_BASE_URL ?? 'PLACEHOLDER_BASE_URL';

// All prices are rough estimates, probably outdated and just for mocking purposes
// Static ids are used to ensure that the models are not created again
// the ids are taken from the staging/production database for interoperability to be able to connect to local telli api or staging
const DEFAULT_MODELS: LlmInsertModel[] = [
  {
    id: 'b870b74d-7458-4dcf-99f6-ace83ef514f4',
    organizationId: ORGANIZATION_ID,
    provider: 'ionos',
    name: 'BAAI/bge-m3',
    displayName: 'Standard Embedding Model',
    setting: {
      provider: 'ionos',
      apiKey: ionosApiKey,
      baseUrl: ionosBaseUrl,
    },
    priceMetadata: {
      type: 'embedding',
      promptTokenPrice: 20, // 0.02 € per 1M tokens
    },
  },
  {
    id: '7dcb063f-5241-4846-b11f-a621ea1dd4a9',
    organizationId: ORGANIZATION_ID,
    provider: 'ionos',
    name: 'black-forest-labs/FLUX.1-schnell',
    displayName: 'FLUX.1',
    setting: {
      provider: 'ionos',
      apiKey: ionosApiKey,
      baseUrl: ionosBaseUrl,
    },
    priceMetadata: {
      type: 'image',
      pricePerImageInCent: 2.88,
    },
  },
  {
    id: '9578ed80-b0c2-4968-b253-d897576e5512',
    organizationId: ORGANIZATION_ID,
    provider: 'ionos',
    name: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
    displayName: 'Llama-3.1-8B',
    description: 'Effizient für leichtere Aufgaben',
    setting: {
      provider: 'ionos',
      apiKey: ionosApiKey,
      baseUrl: ionosBaseUrl,
    },
    priceMetadata: {
      type: 'text',
      promptTokenPrice: 170,
      completionTokenPrice: 280,
    },
  },
  {
    id: '038ac4d1-c8c9-49a1-a2f9-c269b07961aa',
    organizationId: ORGANIZATION_ID,
    provider: 'ionos',
    name: 'mistralai/Mistral-Nemo-Instruct-2407',
    displayName: 'Mistral Nemo Instruct',
    description: 'multilingual, Open Source und effizient',
    setting: {
      provider: 'ionos',
      apiKey: ionosApiKey,
      baseUrl: ionosBaseUrl,
    },
    priceMetadata: {
      type: 'text',
      promptTokenPrice: 150,
      completionTokenPrice: 150,
    },
  },
  {
    id: '4f8a2c1e-93d7-4b6a-a5e0-d2f1c8b7e3a9',
    organizationId: ORGANIZATION_ID,
    provider: 'azure',
    name: 'gpt-4o-mini',
    displayName: 'GPT-4o-mini',
    description: 'GPT-4o Mini model for testing',
    setting: {
      provider: 'azure',
      apiKey: gpt4oMiniApiKey,
      baseUrl: gpt4oMiniBaseUrl,
    },
    priceMetadata: {
      type: 'text',
      promptTokenPrice: 165, // 0.165 € per 1M tokens
      completionTokenPrice: 60, // 0.60 € per 1M tokens
    },
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'webp'],
  },
  {
    id: 'e7b3d9f2-1a4c-4e8b-b6d5-f0c2a9e8d1b7',
    organizationId: ORGANIZATION_ID,
    provider: 'azure',
    name: 'gpt-5-nano',
    displayName: 'GPT-5 nano',
    description: 'GPT-5 nano model for testing',
    setting: {
      provider: 'azure',
      apiKey: gpt5nanoApiKey,
      baseUrl: gpt5nanoBaseUrl,
    },
    priceMetadata: {
      type: 'text',
      promptTokenPrice: 44,
      completionTokenPrice: 334,
    },
    additionalParameters: {
      reasoning: {
        effort: 'minimal',
        summary: null,
      },
    },
    supportedImageFormats: ['jpg', 'jpeg', 'png', 'webp'],
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

    // Print API key in a format parseable by CI (e.g. DE_TEST_API_KEY=sk_...)
    const apiKeyEnvVar = `${PROJECT_ID.replace('-', '_')}_API_KEY`;
    console.log(`${apiKeyEnvVar}=${fullKey}`);

    // Summary
    console.log('Database seeding completed successfully!');
    console.log('\nSummary:');
    console.log(`   Organization: Test Organization`);
    console.log(`   Project: Test Project (ID: ${PROJECT_ID})`);
    console.log(`   LLM Models: ${DEFAULT_MODELS.map((m) => m.name).join(', ')}`);
    console.log(`   Model-Key Mapping: configured`);

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
