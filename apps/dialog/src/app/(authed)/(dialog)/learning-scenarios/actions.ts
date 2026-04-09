'use server';

import { requireAuth } from '@/auth/requireAuth';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  createNewLearningScenario,
  createNewLearningScenarioFromTemplate,
  deleteLearningScenario,
  downloadFileFromLearningScenario,
  linkFileToLearningScenario,
} from '@shared/learning-scenarios/learning-scenario-service';

export async function deleteLearningScenarioAction({ id }: { id: string }) {
  const { user } = await requireAuth();
  return runServerAction(deleteLearningScenario)({ learningScenarioId: id, user });
}

export async function createNewLearningScenarioAction({ modelId }: { modelId: string }) {
  const { user, school } = await requireAuth();

  return runServerAction(createNewLearningScenario)({
    modelId,
    user,
    schoolId: school.id,
  });
}

export async function createNewLearningScenarioFromTemplateAction({
  templateId,
  duplicateLearningScenarioName,
}: {
  templateId: string;
  duplicateLearningScenarioName?: string;
}) {
  const { user, school } = await requireAuth();

  return runServerAction(createNewLearningScenarioFromTemplate)({
    originalLearningScenarioId: templateId,
    user,
    schoolId: school.id,
    duplicateLearningScenarioName,
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
    user,
  });
}

export async function downloadFileFromLearningScenarioAction({
  learningScenarioId,
  fileId,
}: {
  learningScenarioId: string;
  fileId: string;
}) {
  const { user, school } = await requireAuth();

  return runServerAction(downloadFileFromLearningScenario)({
    learningScenarioId,
    fileId,
    schoolId: school.id,
    user,
  });
}
