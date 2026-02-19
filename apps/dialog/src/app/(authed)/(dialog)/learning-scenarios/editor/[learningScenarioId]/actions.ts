'use server';

import { AccessLevel, LearningScenarioSelectModel } from '@shared/db/schema';
import { SharedConversationShareFormValues } from './schema';
import { runServerAction } from '@shared/actions/run-server-action';
import {
  removeFileFromLearningScenario,
  shareLearningScenario,
  unshareLearningScenario,
  updateLearningScenario,
  updateLearningScenarioAccessLevel,
  updateLearningScenarioPicture,
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

  return runServerAction(updateLearningScenarioAccessLevel)({
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
    user,
  });
}

export async function shareLearningScenarioAction({
  learningScenarioId,
  data,
}: {
  learningScenarioId: string;
  data: SharedConversationShareFormValues;
}) {
  const { user, school } = await requireAuth();

  return runServerAction(shareLearningScenario)({
    learningScenarioId,
    user,
    data,
    schoolId: school.id,
  });
}

export async function unshareLearningScenarioAction({
  learningScenarioId,
}: {
  learningScenarioId: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(unshareLearningScenario)({ learningScenarioId, user });
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

  return runServerAction(uploadAvatarPictureForLearningScenario)({
    learningScenarioId,
    croppedImageBlob,
    user,
  });
}
