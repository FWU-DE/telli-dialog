import { Message } from 'ai';

export function getMostRecentUserMessage(messages: Array<Message>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

export function consolidateMessages(messages: Array<Message>): Array<Message> {
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

  return consolidatedMessages;
}

/**
 * Limits the chat history to the most recent messages, keeping the first N messages and the last N messages.
 * @param messages - The messages to limit.
 * @param limitRecent - The number of recent message-pairs to keep e.g. 2 means 2 user messages and 2 assistant messages.
 * @param limitFirst - The number of first message-pairs to keep.
 * @param characterLimit - The maximum number of characters to keep.
 */
export function limitChatHistory({
  messages,
  limitRecent,
  limitFirst = 2,
  characterLimit,
}: {
  messages: Array<Message>;
  limitRecent: number;
  limitFirst?: number;
  characterLimit: number;
}): Array<Message> {
  // Validate inputs

  // First consolidate consecutive messages from the same role
  const consolidatedMessages = consolidateMessages(messages);

  // Always include the last user message even if limitRecent == 0
  limitRecent = limitRecent * 2;
  limitFirst = limitFirst * 2 - 1;

  // If we have fewer messages than the limits, just return all messages
  if (consolidatedMessages.length <= limitFirst + limitRecent) {
    return consolidatedMessages;
  }

  // Initialize arrays for front and back messages
  const frontMessages: Message[] = [];
  const backMessages: Message[] = [];
  let runningTotal = 0;

  // Track which messages are included and which are omitted
  const includedIndices = new Set<number>();
  const omittedIndices = new Set<number>();

  let backIndex = consolidatedMessages.length - 1;
  let frontIndex = 0;
  let manadatoryMessagesIncluded = false;
  // Add messages from the front
  while (
    (runningTotal < characterLimit || !manadatoryMessagesIncluded) &&
    backMessages.length + frontMessages.length < consolidatedMessages.length
  ) {
    const frontMessage = consolidatedMessages[frontIndex];
    const backMessage = consolidatedMessages[backIndex];

    if (frontMessage === undefined) continue;

    runningTotal += frontMessage.content.length;

    if (frontIndex <= limitFirst) {
      frontMessages.push(frontMessage);
      includedIndices.add(frontIndex);
    }

    if (backMessage === undefined) continue;

    runningTotal += backMessage.content.length;
    if (backIndex >= consolidatedMessages.length - limitRecent) {
      backMessages.unshift(backMessage);
      includedIndices.add(backIndex);
    }
    manadatoryMessagesIncluded =
      frontIndex > limitFirst && backIndex < consolidatedMessages.length - limitRecent;
    backIndex--;
    frontIndex++;
  }

  // Mark all messages not in includedIndices as omitted this is left in for debugging purposes
  for (let i = 0; i < consolidatedMessages.length; i++) {
    if (!includedIndices.has(i)) {
      omittedIndices.add(i);
    }
  }

  // Combine front and back messages
  return [...frontMessages, ...backMessages];
}
