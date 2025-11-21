'use server';

import { db } from '@shared/db';
import {
  FileModel,
  fileTable,
  SharedSchoolConversationFileMapping,
  SharedSchoolConversationModel,
  sharedSchoolConversationTable,
} from '@shared/db/schema';
import { getUser } from '@/auth/utils';
import { and, eq } from 'drizzle-orm';
import { SharedConversationShareFormValues } from './schema';
import { generateInviteCode } from '@shared/characters/character-service';
import { dbGetRelatedSharedChatFiles } from '@shared/db/functions/files';

export async function updateSharedSchoolChat({
  id: sharedChatId,
  ...sharedChatProps
}: SharedSchoolConversationModel) {
  const user = await getUser();

  if (user.school === undefined) {
    throw Error('User is not part of a school');
  }

  if (user.school.userRole !== 'teacher') {
    throw Error('Only a teacher can create shared chats');
  }

  const updatedSharedChat = (
    await db
      .update(sharedSchoolConversationTable)
      .set({ ...sharedChatProps })
      .where(
        and(
          eq(sharedSchoolConversationTable.id, sharedChatId),
          eq(sharedSchoolConversationTable.userId, user.id),
        ),
      )
      .returning()
  )[0];

  if (updatedSharedChat === undefined) {
    throw Error('Could not update shared school chat');
  }

  return updatedSharedChat;
}

export async function updateSharedSchoolChatPictureAction({
  id: sharedChatId,
  picturePath,
}: {
  id: string;
  picturePath: string;
}) {
  const user = await getUser();

  const updatedSharedChat = (
    await db
      .update(sharedSchoolConversationTable)
      .set({ pictureId: picturePath })
      .where(
        and(
          eq(sharedSchoolConversationTable.id, sharedChatId),
          eq(sharedSchoolConversationTable.userId, user.id),
        ),
      )
      .returning()
  )[0];

  if (updatedSharedChat === undefined) {
    throw Error('Could not update shared school chat picture');
  }

  return updatedSharedChat;
}

export async function handleInitiateSharedChatShareAction({
  id,
  intelliPointsPercentageLimit,
  usageTimeLimit,
}: { id: string } & SharedConversationShareFormValues) {
  const user = await getUser();

  if (user.school === undefined) {
    throw Error('User is not part of a school');
  }

  if (user.school.userRole !== 'teacher') {
    throw Error('Only a teacher can share a chat');
  }

  const randomString = generateInviteCode();

  const updatedSharedChat = (
    await db
      .update(sharedSchoolConversationTable)
      .set({
        intelligencePointsLimit: intelliPointsPercentageLimit,
        maxUsageTimeLimit: usageTimeLimit,
        inviteCode: randomString.toUpperCase(),
        startedAt: new Date(),
      })
      .where(
        and(
          eq(sharedSchoolConversationTable.id, id),
          eq(sharedSchoolConversationTable.userId, user.id),
        ),
      )
      .returning()
  )[0];

  if (updatedSharedChat === undefined) {
    throw Error('Could not share school chat');
  }

  return updatedSharedChat;
}

export async function handleStopSharedChatShareAction({ id }: { id: string }) {
  const user = await getUser();

  if (user.school === undefined) {
    throw Error('User is not part of a school');
  }

  if (user.school.userRole !== 'teacher') {
    throw Error('Only a teacher can stop share a chat');
  }

  const updatedSharedChat = (
    await db
      .update(sharedSchoolConversationTable)
      .set({
        startedAt: null,
        intelligencePointsLimit: null,
        maxUsageTimeLimit: null,
      })
      .where(
        and(
          eq(sharedSchoolConversationTable.id, id),
          eq(sharedSchoolConversationTable.userId, user.id),
        ),
      )
      .returning()
  )[0];

  if (updatedSharedChat === undefined) {
    throw Error('Could not stop share school chat');
  }

  return updatedSharedChat;
}

export async function fetchFileMapping(id: string): Promise<FileModel[]> {
  const user = await getUser();
  if (user === undefined) return [];
  return await dbGetRelatedSharedChatFiles(id);
}

export async function deleteFileMappingAndEntity({ fileId }: { fileId: string }) {
  await getUser();
  await db
    .delete(SharedSchoolConversationFileMapping)
    .where(eq(SharedSchoolConversationFileMapping.fileId, fileId));
  await db.delete(fileTable).where(eq(fileTable.id, fileId));
}
