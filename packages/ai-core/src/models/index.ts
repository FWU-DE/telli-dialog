import { dbGetModelById } from '../temp-db/functions';
import { AiModel } from '../images/types';

export async function getImageModelById(modelId: string): Promise<AiModel> {
  const model = await dbGetModelById(modelId);
  if (!model) {
    throw new Error(`Model with id ${modelId} not found`);
  }
  return model;
}
