import { describe, it, expect } from 'vitest';
import { limitChatHistory } from './utils';
import { type ChatMessage as Message } from '@/types/chat';
import { generateRandomString } from '../../../../e2e/utils/random';

// Helper function to create a message
function createMessage(role: 'user' | 'assistant', content: string): Message {
  return { role, content, id: generateRandomString(10) };
}

describe('limitChatHistory', () => {
  it('should keep only the last message when character limit is very small', () => {
    // Create messages
    const messages: Message[] = [
      createMessage('user', generateRandomString(100)), // Will be omitted
      createMessage('assistant', generateRandomString(100)), // Will be omitted
      createMessage('user', generateRandomString(100)), // Will be omitted
      createMessage('assistant', generateRandomString(100)), // Will be omitted
      createMessage('user', generateRandomString(100)), // Will be omitted
      createMessage('assistant', generateRandomString(100)), // Last 4 messages
      createMessage('user', generateRandomString(100)),
      createMessage('assistant', generateRandomString(1000)),
      createMessage('user', generateRandomString(100)),
    ];

    const result = limitChatHistory(messages, 300);

    // Should include only the last message (all others exceed budget)
    expect(result.length).toBe(1);
    expect(result[0]?.content).toBe(messages[8]?.content);
  });

  it('should include all messages if character limit allows it', () => {
    // Create messages
    const messages: Message[] = [
      createMessage('user', generateRandomString(100)),
      createMessage('assistant', generateRandomString(100)),
      createMessage('user', generateRandomString(100)),
      createMessage('assistant', generateRandomString(100)),
    ];

    const result = limitChatHistory(messages, 500);

    // Should include all messages since total chars fit within limit
    expect(result.length).toBe(4);
    expect(result).toEqual(messages);
  });

  it('should include most recent older messages up to character limit', () => {
    const messages: Message[] = [
      createMessage('user', generateRandomString(100)), // Will be omitted (too large with msg at index 3)
      createMessage('assistant', generateRandomString(100)), // Will be omitted
      createMessage('user', generateRandomString(70)), // Will be omitted
      createMessage('assistant', generateRandomString(1000)), // Will be omitted (too large)
      createMessage('user', generateRandomString(50)), // Will be included (fits)
      createMessage('assistant', generateRandomString(100)), // Last 4 messages
      createMessage('user', generateRandomString(100)),
      createMessage('assistant', generateRandomString(100)),
      createMessage('user', generateRandomString(100)),
    ];

    const result = limitChatHistory(messages, 500);

    // Should include the most recent messages that fit within 500 chars
    expect(result.length).toBe(5);
    expect(result[0]?.content).toBe(messages[4]?.content);
    expect(result[1]?.content).toBe(messages[5]?.content);
    expect(result[2]?.content).toBe(messages[6]?.content);
    expect(result[3]?.content).toBe(messages[7]?.content);
    expect(result[4]?.content).toBe(messages[8]?.content);
  });
});
