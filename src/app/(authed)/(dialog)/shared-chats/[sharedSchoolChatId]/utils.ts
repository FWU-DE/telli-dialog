import { getMaybeSignedUrlFromS3Get } from '@/s3';
import { customAlphabet } from 'nanoid';
import { SharedSchoolConversationModel } from '@/db/schema';

export type SharedChatWithImage = SharedSchoolConversationModel & {
  maybeSignedPictureUrl: string | undefined;
};

export function calculateTimeLeftBySharedChat({
  startedAt,
  maxUsageTimeLimit,
}: {
  startedAt: Date | null;
  maxUsageTimeLimit: number | null;
}) {
  if (startedAt === null || maxUsageTimeLimit === null) {
    return -1;
  }

  const startedAtDate = new Date(startedAt);

  const nowUtc = new Date().toISOString();
  const nowUtcDate = new Date(nowUtc);

  const sharedChatTimeLeft =
    maxUsageTimeLimit * 60 - Math.floor((nowUtcDate.getTime() - startedAtDate.getTime()) / 1000);

  return sharedChatTimeLeft;
}

export function generateInviteCode(length = 8) {
  const nanoid = customAlphabet('123456789ABCDEFGHIJKLMNPQRSTUVWXYZ', length);
  return nanoid().toUpperCase();
}

export async function enrichSharedChatWithPictureUrl({
  sharedChats,
}: {
  sharedChats: SharedSchoolConversationModel[];
}): Promise<SharedChatWithImage[]> {
  return await Promise.all(
    sharedChats.map(async (sharedChat) => ({
      ...sharedChat,
      maybeSignedPictureUrl: await getMaybeSignedUrlFromS3Get({
        key: sharedChat.pictureId ? `shared-chats/${sharedChat.id}/avatar` : undefined,
      }),
    })),
  );
}
