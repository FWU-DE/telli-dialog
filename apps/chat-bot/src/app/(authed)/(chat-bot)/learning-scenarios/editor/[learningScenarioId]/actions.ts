'use server';

import { AccessLevel, LearningScenarioSelectModel } from '@shared/db/schema';
import { ShareWithLearnersLimitParams } from '@/components/custom-chat/custom-chat-share-with-learners/custom-chat-share-with-learners-limit-params';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  removeFileFromLearningScenario,
  shareLearningScenario,
  unshareLearningScenario,
  updateLearningScenario,
  updateLearningScenarioAccessLevel,
  uploadAvatarPictureForLearningScenario,
} from '@shared/learning-scenarios/learning-scenario-service';
import { requireAuth } from '@/auth/requireAuth';

export async function updateLearningScenarioAccessLevelAction({
  learningScenarioId,
  accessLevel,
}: {
  learningScenarioId: string;
  accessLevel: AccessLevel;
}) {
  const { user } = await requireAuth();

  return runServerAction(
    'updateLearningScenarioAccessLevelAction',
    updateLearningScenarioAccessLevel,
  )({
    learningScenarioId,
    accessLevel,
    user,
  });
}

export async function updateLearningScenarioAction({
  learningScenarioId,
  data,
}: {
  learningScenarioId: string;
  data: LearningScenarioSelectModel;
}) {
  const { user } = await requireAuth();

  return runServerAction(
    'updateLearningScenarioAction',
    updateLearningScenario,
  )({
    learningScenarioId,
    user,
    data,
  });
}

export async function shareLearningScenarioAction({
  learningScenarioId,
  data,
}: {
  learningScenarioId: string;
  data: ShareWithLearnersLimitParams;
}) {
  const { user } = await requireAuth();

  return runServerAction(
    'shareLearningScenarioAction',
    shareLearningScenario,
  )({
    learningScenarioId,
    user,
    data,
  });
}

export async function unshareLearningScenarioAction({
  learningScenarioId,
}: {
  learningScenarioId: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(
    'unshareLearningScenarioAction',
    unshareLearningScenario,
  )({
    learningScenarioId,
    user,
  });
}

export async function removeFileFromLearningScenarioAction({
  learningScenarioId,
  fileId,
}: {
  learningScenarioId: string;
  fileId: string;
}) {
  const { user } = await requireAuth();
  return runServerAction(
    'removeFileFromLearningScenarioAction',
    removeFileFromLearningScenario,
  )({
    learningScenarioId,
    fileId,
    user,
  });
}

export async function uploadAvatarPictureForLearningScenarioAction({
  learningScenarioId,
  croppedImageBlob,
}: {
  learningScenarioId: string;
  croppedImageBlob: Blob;
}) {
  const { user } = await requireAuth();

  return runServerAction(
    'uploadAvatarPictureForLearningScenarioAction',
    uploadAvatarPictureForLearningScenario,
  )({
    learningScenarioId,
    croppedImageBlob,
    user,
  });
}
