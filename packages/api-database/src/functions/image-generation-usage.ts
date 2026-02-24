import { db } from "..";
import {
  ImageGenerationUsageInsertModel,
  imageGenerationUsageTrackingTable,
  llmModelTable,
} from "../schema";
import { eq } from "drizzle-orm";

export async function dbCreateImageGenerationUsage(
  imageGenerationUsage: ImageGenerationUsageInsertModel,
) {
  // Get the model to calculate costs
  const model = await db
    .select()
    .from(llmModelTable)
    .where(eq(llmModelTable.id, imageGenerationUsage.modelId))
    .limit(1);

  if (model.length === 0) {
    throw new Error(`Model not found: ${imageGenerationUsage.modelId}`);
  }

  const modelData = model[0]!;
  let costsInCent = 0;

  // Calculate costs based on model price metadata
  if (modelData.priceMetadata.type === "image") {
    costsInCent = modelData.priceMetadata.pricePerImageInCent;
  }

  const insertedImageGenerationUsage = (
    await db
      .insert(imageGenerationUsageTrackingTable)
      .values({
        ...imageGenerationUsage,
        costsInCent,
      })
      .returning()
  )[0];

  return insertedImageGenerationUsage;
}
