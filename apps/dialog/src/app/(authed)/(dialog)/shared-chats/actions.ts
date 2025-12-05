'use server';

import { requireAuth } from '@/auth/requireAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  createNewLearningScenario,
  deleteLearningScenario,
  LearningScenarioInsertModel,
  linkFileToLearningScenario,
} from '@shared/learning-scenarios/learning-scenario-service';

export async function deleteLearningScenarioAction({ id }: { id: string }) {
  const { user } = await requireAuth();
  return runServerAction(deleteLearningScenario)({ learningScenarioId: id, userId: user.id });
}

export async function createNewLearningScenarioAction({
  data,
}: {
  data: LearningScenarioInsertModel;
}) {
  const { user } = await requireAuth();
  return runServerAction(createNewLearningScenario)({ data, user });
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
