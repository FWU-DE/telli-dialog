import { dbGetModelByRoleAndFederalStateId } from '@shared/db/functions/llm-model';
import type { LlmModelSelectModel } from '@shared/db/schema';
import { getFirstTextModel } from './llm-model-service';

export async function getDefaultModelNameByFederalStateId(
  federalStateId: string,
  models: LlmModelSelectModel[],
) {
  const configuredModel = await dbGetModelByRoleAndFederalStateId({
    role: 'default-chat',
    federalStateId,
  });
  const model = configuredModel ?? getFirstTextModel(models);
  if (!model) throw new Error(`No default text model found for federal state ${federalStateId}`);
  return model.name;
}
