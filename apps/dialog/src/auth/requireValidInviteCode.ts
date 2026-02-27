import {
  getChatInfoByInviteCode,
  type ChatInfo,
} from '@shared/sharing/get-chat-info-by-invite-code';

export async function requireValidInviteCode(inviteCode: string): Promise<{ chatInfo: ChatInfo }> {
  try {
    const chatInfo = await getChatInfoByInviteCode(inviteCode);
    return { chatInfo };
  } catch (error) {
    throw error;
  }
}
