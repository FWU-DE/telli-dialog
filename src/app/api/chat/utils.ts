import { Message } from 'ai';

export function getMostRecentUserMessage(messages: Array<Message>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function limitChatHistory({
  messages,
  limit,
}: {
  messages: Array<Message>;
  limit: number;
}): Array<Message> {
  // Validate that limit is even
  if (limit % 2 !== 0 || messages[0] === undefined ) {
    throw new Error(
      'Limit must be an even number to ensure equal distribution between user and assistant messages',
    );
  }

  if (messages.length <= limit) {
    return messages;
  }
  const firstMessage: Message = messages[0]
  const userMessages: Message[] = [];
  const assistantMessages: Message[] = [];
  const messagesPerRole = limit / 2;

  // Iterate from most recent to oldest
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message === undefined) {
      continue;
    }

    if (message.role === 'user' && userMessages.length < messagesPerRole) {
      userMessages.push(message);
    } else if (message.role === 'assistant' && assistantMessages.length < messagesPerRole) {
      assistantMessages.push(message);
    }

    // Break if we've collected enough of each role start always with a user message
    if (
      userMessages.length === messagesPerRole + 1 &&
      assistantMessages.length === messagesPerRole
    ) {
      break;
    }
  }

  // Combine and sort messages back to chronological order
  const limitedMessages = [firstMessage, ...userMessages, ...assistantMessages].sort((a, b) => {
    const aIndex = messages.indexOf(a);
    const bIndex = messages.indexOf(b);
    return aIndex - bIndex;
  });

  return limitedMessages;
}
