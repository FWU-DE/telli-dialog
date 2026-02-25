import { redirect } from 'next/navigation';
import {
  getChatInfoByInviteCode,
  type ChatInfo,
} from '@shared/sharing/get-chat-info-by-invite-code';
import { NotFoundError } from '@shared/error';

export async function requireValidInviteCode(inviteCode: string): Promise<{ chatInfo: ChatInfo }> {
  try {
    const chatInfo = await getChatInfoByInviteCode(inviteCode);
    return { chatInfo };
  } catch (error) {
    if (error instanceof NotFoundError) {
      redirect('/login');
    }
    throw error;
  }
}
