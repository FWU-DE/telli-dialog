'use server';

import { requireAuth } from '@/auth/requireAuth';
import {
  createNewCharacter,
  deleteFileMappingAndEntity,
  fetchFileMappings,
  linkFileToCharacter,
} from '@shared/characters/character-service';
import { runServerAction } from '@shared/actions/run-server-action';
import { error } from 'console';
import { BusinessError } from '@shared/error/business-error';
import { NotFoundError } from '@shared/error/not-found-error';
import { notFound } from 'next/navigation';
import { ForbiddenError } from '@shared/error';

export async function createNewCharacterAction({
  modelId,
  templatePictureId,
  templateId,
}: {
  modelId?: string;
  templatePictureId?: string;
  templateId?: string;
}) {
  const { user, school, federalState } = await requireAuth();

  return runServerAction(createNewCharacter)({
    federalStateId: federalState.id,
    modelId: modelId,
    schoolId: school.id,
    user,
    templatePictureId,
    templateId,
  });
}

export async function deleteFileMappingAndEntityAction({
  characterId,
  fileId,
}: {
  characterId: string;
  fileId: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(deleteFileMappingAndEntity)({
    characterId,
    fileId,
    userId: user.id,
  });
}

export async function fetchFileMappingAction(conversationId: string) {
  const { user, school } = await requireAuth();

  return runServerAction(fetchFileMappings)({
    characterId: conversationId,
    userId: user.id,
    schoolId: school.id,
  });
}

export async function linkFileToCharacterAction({
  fileId,
  characterId,
}: {
  fileId: string;
  characterId: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(linkFileToCharacter)({ fileId, characterId, userId: user.id });
}

export async function testAction() {
  const { user } = await requireAuth();

  return runServerAction(throwExpectedNotFoundError)();
}

async function throwExpectedBusinessError() {
  throw new ForbiddenError('not allowed');
}

async function throwExpectedNotFoundError() {
  throw new NotFoundError('entity not found');
}

async function throwUnexpectedError() {
  throw new Error('unexpected error');
}
