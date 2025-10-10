/**
 * Script to calculate and update costs for existing usage records
 * This script should be run after adding the costs_in_cent column to all three tables
 */

import { db } from '../index';

import { eq } from 'drizzle-orm';
import { calculateCostsInCents } from '@/app/api/utils';
import {
  conversationUsageTracking,
  sharedCharacterChatUsageTrackingTable,
  sharedSchoolConversationUsageTracking,
} from '../schema';
import { dbGetAllLlmModels } from '../functions/llm-model';

async function updateConversationUsageCosts(
  table:
    | typeof conversationUsageTracking
    | typeof sharedSchoolConversationUsageTracking
    | typeof sharedCharacterChatUsageTrackingTable,
) {
  console.log('Starting usage cost updates');

  // Get all records without costs calculated
  const usages = await db.select().from(table).where(eq(table.costsInCent, 0));

  console.log(`Found ${usages.length} usage records to update`);

  // Create a map for quick model lookup
  const models = await dbGetAllLlmModels();
  const modelMap = new Map();
  for (const model of models) {
    modelMap.set(model.id, model);
  }

  let updatedCount = 0;
  for (const usage of usages) {
    const model = modelMap.get(usage.modelId);

    if (!model) {
      console.warn(`Model not found for usage ${usage.id}: ${usage.modelId}`);
      continue;
    }

    try {
      const costsInCent = calculateCostsInCents(model, usage);

      // Update the record with calculated costs
      await db.update(table).set({ costsInCent }).where(eq(table.id, usage.id));
    } catch (error) {
      console.error(`Error updating usage ${usage.id}:`, error);
    }

    updatedCount++;

    if (updatedCount % 50 === 0) {
      console.log(`Updated ${updatedCount}/${usages.length} records`);
    }
  }

  console.log(`Completed updating ${updatedCount} usage records`);
}

async function main() {
  try {
    await updateConversationUsageCosts(conversationUsageTracking);
    //await updateConversationUsageCosts(sharedSchoolConversationUsageTracking);
    //await updateConversationUsageCosts(sharedCharacterChatUsageTrackingTable);

    console.log('Cost calculation completed successfully!');
  } catch (error) {
    console.error('Error during cost calculation:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
