import { type UserAndContext } from '@/auth/types';
import { ConversationModel } from '@/db/types';

export function getPriceLimitByUser(user: UserAndContext) {
  if (user.school === undefined || user.federalState === undefined) return null;

  if (user.school.userRole === 'student') {
    return user.federalState.studentPriceLimit;
  }

  if (user.school.userRole === 'teacher') {
    return user.federalState.teacherPriceLimit;
  }

  return 500;
}

export async function fetchClientSideConversations(): Promise<ConversationModel[]> {
  const response = await fetch('/api/conversations', { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return Array.isArray(data.conversations) ? data.conversations : [];
}
