'use server';

import { SharedSchoolConversationSelectModel } from '@shared/db/schema';
import { SharedConversationShareFormValues } from './schema';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  removeFileFromLearningScenario,
  shareLearningScenario,
  unshareLearningScenario,
  updateLearningScenario,
  updateLearningScenarioPicture,
} from '@shared/learning-scenarios/learning-scenario-service';
import { requireAuth } from '@/auth/requireAuth';

export async function updateLearningScenarioAction({
  learningScenarioId,
  data,
}: {
  learningScenarioId: string;
  data: SharedSchoolConversationSelectModel;
}) {
  const { user } = await requireAuth();

  return runServerAction(updateLearningScenario)({
    learningScenarioId,
    user,
    data,
  });
}

export async function updateLearningScenarioPictureAction({
  learningScenarioId,
  picturePath,
}: {
  learningScenarioId: string;
  picturePath: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(updateLearningScenarioPicture)({
    learningScenarioId,
    picturePath,
    userId: user.id,
  });
}

export async function shareLearningScenarioAction({
  learningScenarioId,
  data,
}: {
  learningScenarioId: string;
  data: SharedConversationShareFormValues;
}) {
  const { user } = await requireAuth();

  return runServerAction(shareLearningScenario)({
    learningScenarioId,
    userId: user.id,
    data,
  });
}

export async function unshareLearningScenarioAction({
  learningScenarioId,
}: {
  learningScenarioId: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(unshareLearningScenario)({ learningScenarioId, userId: user.id });
}

export async function removeFileFromLearningScenarioAction({
  learningScenarioId,
  fileId,
}: {
  learningScenarioId: string;
  fileId: string;
}) {
  const { user } = await requireAuth();
  return runServerAction(removeFileFromLearningScenario)({
    learningScenarioId,
    fileId,
    userId: user.id,
  });
}
