import { Message } from 'ai';

export function getMostRecentUserMessage(messages: Array<Message>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function limitChatHistory({
  messages,
  limitRecent,
  limitFirst = 1,
}: {
  messages: Array<Message>;
  limitRecent: number;
  limitFirst?: number;
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
      // Assuming Message has a content property that's a string
      prevMessage.content += '\n\n' + currentMessage.content;
    } else {
      // Otherwise add as a new message
      consolidatedMessages.push(currentMessage);
    }
  }

  // If we have fewer consolidated messages than the limit, return all consolidated messages
  if (consolidatedMessages.length <= limitRecent) {
    return consolidatedMessages;
  }

  // Ensure keepFirstN doesn't exceed message count
  limitFirst = Math.min(limitFirst, consolidatedMessages.length);

  // Get the first n messages
  const firstNMessages = consolidatedMessages.slice(0, limitFirst);

  const userMessages: Message[] = [];
  const assistantMessages: Message[] = [];
  const messagesPerRole = limitRecent / 2;

  // Iterate from most recent to oldest, skipping the first n messages
  for (let i = consolidatedMessages.length - 1; i >= limitFirst; i--) {
    const message = consolidatedMessages[i];

    if (message?.role === 'user' && userMessages.length < messagesPerRole) {
      userMessages.push(message);
    } else if (message?.role === 'assistant' && assistantMessages.length < messagesPerRole) {
      assistantMessages.push(message);
    }

    // Break if we've collected enough of each role
    if (userMessages.length >= messagesPerRole && assistantMessages.length >= messagesPerRole) {
      break;
    }
  }

  // Combine the first n messages with the collected recent messages in their original order
  const limitedMessages: Message[] = [...firstNMessages];
  const lastMsgIndex = consolidatedMessages.length - limitRecent;
  for (let i = lastMsgIndex; i < consolidatedMessages.length; i++) {
    const message = consolidatedMessages[i];
    if (message === undefined || firstNMessages.includes(message)) {
      continue;
    }
    if ([...userMessages, ...assistantMessages].includes(message)) {
      limitedMessages.push(message);
    }
  }

  return limitedMessages;
}
