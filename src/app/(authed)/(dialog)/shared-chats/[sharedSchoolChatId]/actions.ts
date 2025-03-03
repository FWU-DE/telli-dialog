'use server';

import { db } from '@/db';
import { SharedSchoolConversationModel, sharedSchoolConversationTable } from '@/db/schema';
import { getUser } from '@/auth/utils';
import { and, eq } from 'drizzle-orm';
import { parseNumberOrThrow } from '@/utils/number';
import { SharedConversationShareFormValues } from './schema';
import { generateInviteCode } from './utils';

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

export async function handleInitiateSharedChatShareAction({
  id,
  intelliPointsPercentageLimit: _intelliPointsPercentageLimit,
  usageTimeLimit: _usageTimeLimit,
}: { id: string } & SharedConversationShareFormValues) {
  const user = await getUser();

  if (user.school === undefined) {
    throw Error('User is not part of a school');
  }

  if (user.school.userRole !== 'teacher') {
    throw Error('Only a teacher can share a chat');
  }

  const intelliPointsPercentageLimit = parseNumberOrThrow(_intelliPointsPercentageLimit);
  const usageTimeLimitInSeconds = parseNumberOrThrow(_usageTimeLimit);

  const randomString = generateInviteCode();

  const updatedSharedChat = (
    await db
      .update(sharedSchoolConversationTable)
      .set({
        intelligencePointsLimit: intelliPointsPercentageLimit,
        maxUsageTimeLimit: usageTimeLimitInSeconds,
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
