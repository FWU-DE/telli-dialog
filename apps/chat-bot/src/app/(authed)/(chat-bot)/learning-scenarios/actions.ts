'use server';

import { requireAuth } from '@/auth/requireAuth';
import { userHasCompletedTraining } from '@/auth/utils';
import { checkProductAccess } from '@/utils/vidis/access';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  createNewLearningScenario,
  createNewLearningScenarioFromTemplate,
  deleteLearningScenario,
  downloadFileFromLearningScenario,
  linkFileToLearningScenario,
} from '@shared/learning-scenarios/learning-scenario-service';
import { sendLearningScenarioPreviewMessage } from '@/app/api/shared-chat/learning-scenario-preview-service';
import { ChatMessage, SendMessageResult } from '@/types/chat';

export type { ChatMessage, SendMessageResult } from '@/types/chat';

export async function deleteLearningScenarioAction({ id }: { id: string }) {
  const { user } = await requireAuth();
  return runServerAction(deleteLearningScenario)({ learningScenarioId: id, user });
}

export async function createNewLearningScenarioAction({ modelId }: { modelId: string }) {
  const { user } = await requireAuth();

  return runServerAction(createNewLearningScenario)({
    modelId,
    user,
  });
}

export async function createNewLearningScenarioFromTemplateAction({
  templateId,
  duplicateLearningScenarioName,
}: {
  templateId: string;
  duplicateLearningScenarioName?: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(createNewLearningScenarioFromTemplate)({
    originalLearningScenarioId: templateId,
    user,
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
  const { user } = await requireAuth();

  return runServerAction(downloadFileFromLearningScenario)({
    learningScenarioId,
    fileId,
    user,
  });
}

export async function sendLearningScenarioPreviewMessageAction({
  previewSessionId,
  learningScenarioId,
  messages,
  modelId,
}: {
  previewSessionId: string;
  learningScenarioId: string;
  messages: ChatMessage[];
  modelId: string;
}): Promise<SendMessageResult> {
  const [{ user, federalState }, hasCompletedTraining] = await Promise.all([
    requireAuth(),
    userHasCompletedTraining(),
  ]);
  const userAndContext = {
    ...user,
    federalState,
  };
  const productAccess = checkProductAccess({ ...userAndContext, hasCompletedTraining });

  if (!productAccess.hasAccess) {
    throw new Error(productAccess.errorType);
  }

  return sendLearningScenarioPreviewMessage({
    previewSessionId,
    learningScenarioId,
    messages,
    modelId,
    user: userAndContext,
  });
}
