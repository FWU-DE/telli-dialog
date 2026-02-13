'use server';

import { runServerAction } from '@shared/actions/run-server-action';
import { getChatIdByInviteCode } from '@shared/sharing/get-chat-id-by-invite-code';

export async function getChatIdByInviteCodeAction(inviteCode: string) {
  return runServerAction(getChatIdByInviteCode)(inviteCode);
}
