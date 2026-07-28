import { dbGetModelByRoleAndFederalStateId } from '@shared/db/functions/llm-model';
import type { LlmModelSelectModel } from '@shared/db/schema';
import { getFirstTextModel } from './llm-model-service';

export async function getDefaultModel({
  federalStateId,
  models,
}: {
  federalStateId: string;
  models: LlmModelSelectModel[];
}): Promise<LlmModelSelectModel | undefined> {
  return (
    (await dbGetModelByRoleAndFederalStateId({ role: 'default-chat', federalStateId })) ??
    getFirstTextModel(models)
  );
}

export async function getDefaultModelNameByFederalStateId(
  federalStateId: string,
  models: LlmModelSelectModel[],
) {
  const model = await getDefaultModel({ federalStateId, models });
  if (!model) throw new Error(`No default text model found for federal state ${federalStateId}`);
  return model.name;
}
