import { dbGetModelByRoleAndFederalStateId } from '@shared/db/functions/llm-model';
import { logError } from '@shared/logging';
import { valkey } from '@shared/valkey';
import type { LlmModelSelectModel } from '@shared/db/schema';

const MODEL_UNAVAILABLE_TTL_SECONDS = 45;
const MODEL_UNAVAILABLE_PREFIX = 'model-unavailable:v1:';

async function isUnavailable(modelId: string) {
  try {
    return await valkey.hasItem(MODEL_UNAVAILABLE_PREFIX + modelId);
  } catch (error) {
    logError('Failed to check model circuit breaker, allowing model', error, { modelId });
    return false;
  }
}

async function markUnavailable(modelId: string) {
  try {
    await valkey.setItem(MODEL_UNAVAILABLE_PREFIX + modelId, true, {
      ttl: MODEL_UNAVAILABLE_TTL_SECONDS,
    });
  } catch (error) {
    logError('Failed to update model circuit breaker', error, { modelId });
  }
}

export async function getChatModelFallback({
  model,
  federalStateId,
}: {
  model: LlmModelSelectModel;
  federalStateId: string;
}) {
  if (model.provider !== 'bifrost') {
    return { generationModelId: model.id, fallbackModelIds: [], candidateModelIds: [model.id] };
  }

  const fallback = await dbGetModelByRoleAndFederalStateId({
    role: 'fallback',
    federalStateId,
  });
  if (!fallback || fallback.id === model.id) {
    return { generationModelId: model.id, fallbackModelIds: [], candidateModelIds: [model.id] };
  }

  const unavailable = await Promise.all(
    [model, fallback].map((candidate) => isUnavailable(candidate.id)),
  );
  const availableCandidates = [model, fallback].filter((_, index) => !unavailable[index]);
  const candidates = availableCandidates.length > 0 ? availableCandidates : [fallback];

  return {
    generationModelId: candidates[0]!.id,
    fallbackModelIds: candidates.slice(1).map((candidate) => candidate.id),
    candidateModelIds: candidates.map((candidate) => candidate.id),
  };
}

export async function markSkippedChatModels({
  candidateModelIds,
  usedModelId,
}: {
  candidateModelIds: string[];
  usedModelId?: string;
}) {
  const usedIndex = usedModelId ? candidateModelIds.indexOf(usedModelId) : -1;
  if (usedIndex <= 0) return;

  await Promise.all(candidateModelIds.slice(0, usedIndex).map(markUnavailable));
}
