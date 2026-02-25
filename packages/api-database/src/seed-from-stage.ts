import { db as localDb } from "./index";
import {
  organizationTable,
  projectTable,
  apiKeyTable,
  llmModelTable,
  llmModelApiKeyMappingTable,
  OrganizationModel,
  ProjectModel,
  LlmModel,
  ApiKeyModel,
  LlmModelApiKeyMappingModel,
} from "./schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

// Loads all required data from the staging database into the local database
// including organizations, projects, api keys, llm models and mappings.
// Does not copy over user data or usage data.
// Useful for local development to have the same models and api keys as staging.

const connectionString = process.env.STAGE_DATABASE_URL;
if (!connectionString) {
  throw new Error("STAGE_DATABASE_URL is not set");
}
const pool = new Pool({
  connectionString,
  max: 12,
});
const stageDb = drizzle({ client: pool });

async function getOrganizations(): Promise<OrganizationModel[]> {
  return await stageDb.select().from(organizationTable);
}

async function getProjects(): Promise<ProjectModel[]> {
  return await stageDb.select().from(projectTable);
}

async function getApiKeys(): Promise<ApiKeyModel[]> {
  return await stageDb.select().from(apiKeyTable);
}

async function getModels(): Promise<LlmModel[]> {
  return await stageDb.select().from(llmModelTable);
}

async function getModelKeyMappings(): Promise<LlmModelApiKeyMappingModel[]> {
  return await stageDb.select().from(llmModelApiKeyMappingTable);
}

export async function seedDatabase() {
  console.log("Starting database seeding...");

  try {
    // 1. Create organization
    await localDb
      .insert(organizationTable)
      .values(await getOrganizations())
      .onConflictDoNothing()
      .returning();

    // 2. Create project
    await localDb
      .insert(projectTable)
      .values(await getProjects())
      .onConflictDoNothing()
      .returning();

    // 3. Create API keys
    await localDb
      .insert(apiKeyTable)
      .values(await getApiKeys())
      .onConflictDoNothing()
      .returning();

    // 4. Create LLM models
    await localDb
      .insert(llmModelTable)
      .values(await getModels())
      .onConflictDoNothing()
      .returning();

    // 5. Create model-key mappings
    await localDb
      .insert(llmModelApiKeyMappingTable)
      .values(await getModelKeyMappings())
      .onConflictDoNothing()
      .returning();

    // 6. Summary
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

try {
  await seedDatabase();
  console.log("Seeding completed");
  process.exit(0);
} catch (error) {
  console.error("Seeding failed:", error);
  process.exit(1);
}
