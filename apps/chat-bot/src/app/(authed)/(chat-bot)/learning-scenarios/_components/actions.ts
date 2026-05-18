'use server';

import { runServerAction } from '@shared/actions/run-server-action';
import { getChatInfoByInviteCode } from '@shared/sharing/get-chat-info-by-invite-code';

export async function getChatInfoByInviteCodeAction(inviteCode: string) {
  return runServerAction(getChatInfoByInviteCode)(inviteCode);
}
