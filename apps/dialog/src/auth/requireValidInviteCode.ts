import { redirect } from 'next/navigation';
import { getChatIdByInviteCode, type ChatInfo } from '@shared/sharing/get-chat-id-by-invite-code';
import { NotFoundError } from '@shared/error';

export async function requireValidInviteCode(inviteCode: string): Promise<{ chatInfo: ChatInfo }> {
  try {
    const chatInfo = await getChatIdByInviteCode(inviteCode);
    return { chatInfo };
  } catch (error) {
    if (error instanceof NotFoundError) {
      redirect('/login');
    }
    throw error;
  }
}
