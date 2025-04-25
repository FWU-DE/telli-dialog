import { TOTAL_CHAT_LENGTH_LIMIT } from '@/configuration-text-inputs/const';
import { Message } from 'ai';

export function getMostRecentUserMessage(messages: Array<Message>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function limitChatHistory({
  messages,
  limitRecent,
  limitFirst = 2,
  characterLimit = TOTAL_CHAT_LENGTH_LIMIT,
}: {
  messages: Array<Message>;
  limitRecent: number;
  limitFirst?: number;
  characterLimit?: number;
}): Array<Message> {
  // Validate inputs
  if (limitRecent % 2 !== 0 || messages.length === 0) {
    throw new Error(
      'Limit must be an even number to ensure equal distribution between user and assistant messages',
    );
  }

  if (limitFirst < 0) {
    throw new Error('keepFirstN must be a non-negative number');
  }

  // First consolidate consecutive messages from the same role
  const consolidatedMessages: Array<Message> = [];

  for (let i = 0; i < messages.length; i++) {
    const currentMessage = messages[i];
    if (currentMessage === undefined) {
      continue;
    }
    const prevMessage = consolidatedMessages[consolidatedMessages.length - 1];

    // If this message has the same role as the previous one, merge them
    if (prevMessage && prevMessage.role === currentMessage?.role) {
      prevMessage.content += '\n\n' + currentMessage.content;
    } else {
      // Otherwise add as a new message
      consolidatedMessages.push({ ...currentMessage });
    }
  }

  // Always include the last user message even if limitRecent == 0
  limitRecent = limitRecent + 1;
  limitFirst = limitFirst - 1;
  const indexRecent = consolidatedMessages.length - limitRecent;

  const newMessages: Message[] = [];
  let runningTotal = 0;
  for (let i = 0; i < messages.length; i++) {
    const message = consolidatedMessages[i];
    if (message === undefined) continue;
    runningTotal = runningTotal + message.content.length;
    if ((i <= limitFirst && runningTotal > characterLimit) || i >= indexRecent) {
      newMessages.push(message);
    }
  }
  return newMessages;
}
