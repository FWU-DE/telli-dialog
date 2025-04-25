import { Message } from 'ai';

export function getMostRecentUserMessage(messages: Array<Message>) {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.at(-1);
}

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

  // Add messages from the front
  for (let i = 0; i <= limitFirst; i++) {
    const message = consolidatedMessages[i];
    if (message === undefined) continue;

    runningTotal += message.content.length;
    frontMessages.push(message);
    includedIndices.add(i);
  }

  // Add messages from the back
  for (
    let i = consolidatedMessages.length - 1;
    i >= consolidatedMessages.length - limitRecent;
    i--
  ) {
    const message = consolidatedMessages[i];
    if (message === undefined) continue;

    runningTotal += message.content.length;
    backMessages.unshift(message);
    includedIndices.add(i);
  }

  // Mark all messages not in includedIndices as omitted
  for (let i = 0; i < consolidatedMessages.length; i++) {
    if (!includedIndices.has(i)) {
      omittedIndices.add(i);
    }
  }

  // Combine front and back messages
  return [...frontMessages, ...backMessages];
}
