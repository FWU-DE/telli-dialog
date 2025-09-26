import { ConversationModel } from '@/db/types';

export async function fetchClientSideConversations(): Promise<ConversationModel[]> {
  const response = await fetch('/api/conversations', { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to fetch conversations: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return Array.isArray(data.conversations) ? data.conversations : [];
}
