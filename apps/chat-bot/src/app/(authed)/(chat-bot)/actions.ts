'use server';

import { requireAuth } from '@/auth/requireAuth';
import { VERSION } from '@/components/modals/const';
import { runServerAction } from '@shared/actions/run-server-action';
import deleteConversation, {
  getConversation,
  updateConversationTitle,
} from '@shared/conversation/conversation-service';
import { dbGetRelatedFiles } from '@shared/db/functions/files';
import { dbGetLatestArtifactVersionByConversationId } from '@shared/db/functions/artifacts';
import { dbUpdateUserTermsVersion } from '@shared/db/functions/user';
import { FileModel } from '@shared/db/schema';
import { trackInfoBannerView } from '@shared/info-banners/info-banner-service';

export async function deleteConversationAction({ conversationId }: { conversationId: string }) {
  const { user } = await requireAuth();

  return runServerAction(deleteConversation)({ conversationId, userId: user.id });
}

/** Triggered by the user if they want to update the name of a conversation */
export async function updateConversationTitleAction({
  conversationId,
  name,
}: {
  conversationId: string;
  name: string;
}) {
  const { user } = await requireAuth();

  return runServerAction(updateConversationTitle)({ conversationId, name, userId: user.id });
}

export async function setUserAcceptConditions(): Promise<boolean> {
  const { user } = await requireAuth();
  const updated = await dbUpdateUserTermsVersion({
    userId: user.id,
    versionAcceptedConditions: VERSION,
  });
  return updated?.versionAcceptedConditions === VERSION;
}

export async function refetchFileMapping(
  conversationId: string,
): Promise<Map<string, FileModel[]>> {
  const { user } = await requireAuth();
  // Verify the user owns this conversation before returning file data
  await getConversation({ conversationId, userId: user.id });
  return await dbGetRelatedFiles(conversationId);
}

export async function getLatestArtifactForConversationAction(conversationId: string) {
  const { user } = await requireAuth();
  await getConversation({ conversationId, userId: user.id });
  const row = await dbGetLatestArtifactVersionByConversationId(conversationId);
  return row ? { content: row.content } : null;
}

export async function trackInfoBannerViewAction(infoBannerId: string): Promise<void> {
  const { user } = await requireAuth();

  await runServerAction(trackInfoBannerView)({ infoBannerId, userId: user.id });
}
