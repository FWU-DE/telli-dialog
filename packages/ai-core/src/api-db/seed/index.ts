import { dbApi, LlmInsertModel } from '../index';
import {
  apiKeyTable,
  llmModelApiKeyMappingTable,
  llmModelTable,
  organizationTable,
  projectTable,
} from '../schema';
import { env } from './env';
import { createApiKeyRecord } from './utils';

const PROJECT_ID = 'DE-TEST';
const API_KEY_NAME = 'e2e API Key';

function getDefaultModels(organizationId: string): LlmInsertModel[] {
  return [
    {
      organizationId,
      provider: 'ionos',
      name: 'BAAI/bge-m3',
      displayName: 'Standard Embedding Model',
      setting: {
        provider: 'ionos',
        apiKey: env.ionosApiKey,
        baseUrl: env.ionosBaseUrl,
      },
      priceMetadata: {
        type: 'embedding',
        promptTokenPrice: 20, // 0.02 € per 1M tokens,
      },
    },
    {
      organizationId,
      provider: 'ionos',
      name: 'black-forest-labs/FLUX.1-schnell',
      displayName: 'FLUX.1',
      setting: {
        provider: 'ionos',
        apiKey: env.ionosApiKey,
        baseUrl: env.ionosBaseUrl,
      },
      priceMetadata: {
        type: 'image',
        pricePerImageInCent: 2.88, // 0.02 € per 1M tokens,
      },
    },
    {
      organizationId,
      provider: 'ionos',
      name: 'meta-llama/Llama-3.3-70B-Instruct',
      displayName: 'Llama-3.3-70B',
      description: 'Llama-3.3-70B model for testing',
      setting: {
        provider: 'ionos',
        apiKey: env.ionosApiKey,
        baseUrl: env.ionosBaseUrl,
      },
      priceMetadata: {
        type: 'text',
        promptTokenPrice: 150, // 0.15 € per 1M tokens,
        completionTokenPrice: 250, // 0.25 € per 1M tokens,
      },
    },
    {
      organizationId,
      provider: 'azure',
      name: 'gpt-4o-mini',
      displayName: 'GPT-4o-mini',
      description: 'GPT-4o Mini model for testing',
      setting: {
        provider: 'azure',
        apiKey: env.gpt4oMiniApiKey,
        baseUrl: env.gpt4oMiniBaseUrl,
      },
      priceMetadata: {
        type: 'text',
        promptTokenPrice: 165, // 0.165 € per 1M tokens,
        completionTokenPrice: 60, // 0.60 € per 1M tokens,
      },
      supportedImageFormats: ['jpg', 'jpeg', 'png', 'webp'],
    },
    {
      organizationId,
      provider: 'azure',
      name: 'gpt-5-nano',
      displayName: 'GPT-5 nano',
      description: 'GPT-5 nano model for testing',
      setting: {
        provider: 'azure',
        apiKey: env.gpt5nanoApiKey,
        baseUrl: env.gpt5nanoBaseUrl,
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
}

export async function seedDatabase() {
  console.log('Starting database seeding...');

  // 1. Create test organization
  // Since there's no unique constraint on name, we'll check if one exists first
  const [organization] = await dbApi
    .insert(organizationTable)
    .values({
      name: 'Test Organization',
    })
    .onConflictDoNothing()
    .returning();

  if (!organization) throw new Error('Failed to create organization');

  // 2. Create test project (using primary key for upsert)
  const [project] = await dbApi
    .insert(projectTable)
    .values({
      id: PROJECT_ID,
      name: 'Test Project',
      organizationId: organization.id,
    })
    .onConflictDoNothing()
    .returning();

  if (!project) throw new Error('Failed to create project');

  // 3. Create test API key
  // Since keyId doesn't have a unique constraint, we'll check first

  const { keyId, secretHash, fullKey } = await createApiKeyRecord();

  // Create new API key
  const [apiKey] = await dbApi
    .insert(apiKeyTable)
    .values({
      name: API_KEY_NAME,
      keyId,
      secretHash,
      projectId: PROJECT_ID,
      limitInCent: 5000, // $50.00 limit per key
      state: 'active',
    })
    .returning();

  if (!apiKey) throw new Error('Failed to create API key');

  // Print created API Key on console; will be used in e2e pipeline to seed telli-dialog
  const apiKeyEnvVar = `${PROJECT_ID.replace('-', '_')}_API_KEY`;
  console.log(`${apiKeyEnvVar}=${fullKey}`);

  // 5. Create API key to model mapping
  const models = getDefaultModels(organization.id);
  for (const model of models) {
    const [createdModel] = await dbApi
      .insert(llmModelTable)
      .values(model)
      .onConflictDoNothing()
      .returning();

    if (!createdModel) throw new Error('Failed to create model');

    await dbApi
      .insert(llmModelApiKeyMappingTable)
      .values({
        llmModelId: createdModel.id,
        apiKeyId: apiKey.id,
      })
      .onConflictDoNothing();
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
