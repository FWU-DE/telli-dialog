'use server';

import { requireAuth } from '@/auth/requireAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  createNewLearningScenario,
  deleteLearningScenario,
  linkFileToLearningScenario,
} from '@shared/learning-scenarios/learning-scenario-service';

export async function deleteLearningScenarioAction({ id }: { id: string }) {
  const { user } = await requireAuth();
  return runServerAction(deleteLearningScenario)({ learningScenarioId: id, userId: user.id });
}

export async function createNewLearningScenarioAction({ modelId }: { modelId: string }) {
  const { user, school } = await requireAuth();

  return runServerAction(createNewLearningScenario)({
    modelId,
    user,
    schoolId: school.id,
  });
}

export async function linkFileToLearningScenarioAction({
  fileId,
  learningScenarioId,
}: {
  fileId: string;
  learningScenarioId: string;
}) {
  const { user } = await requireAuth();
  return runServerAction(linkFileToLearningScenario)({
    fileId,
    learningScenarioId,
    userId: user.id,
  });
}
