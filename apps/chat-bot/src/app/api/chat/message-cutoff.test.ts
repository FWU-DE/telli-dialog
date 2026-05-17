import { describe, it, expect } from 'vitest';
import { limitChatHistory } from './utils';
import { type ChatMessage as Message } from '@/types/chat';
import { generateRandomString } from '../../../../e2e/utils/random';

// Helper function to create a message
function createMessage(role: 'user' | 'assistant', content: string): Message {
  return { role, content, id: generateRandomString(10) };
}

describe('limitChatHistory', () => {
  it('should include first 2 and last 4 messages regardless of content length', () => {
    // Create messages
    const messages: Message[] = [
      createMessage('user', generateRandomString(100)), // First message
      createMessage('assistant', generateRandomString(100)), // Second message
      createMessage('user', generateRandomString(100)), // Will be omitted
      createMessage('assistant', generateRandomString(100)), // Will be omitted
      createMessage('user', generateRandomString(100)), // Will be omitted
      createMessage('assistant', generateRandomString(100)), // Last 4 messages
      createMessage('user', generateRandomString(100)),
      createMessage('assistant', generateRandomString(1000)),
      createMessage('user', generateRandomString(100)),
    ];

    const result = limitChatHistory({
      messages,
      limitRecent: 2,
      limitFirst: 1,
      characterLimit: 300,
    });

    // Should include first 2 and last 4 messages
    expect(result.length).toBe(6);
    expect(result[0]?.content).toBe(messages?.[0]?.content);
    expect(result[1]?.content).toBe(messages?.[1]?.content);
    expect(result[2]?.content).toBe(messages?.[5]?.content);
    expect(result[3]?.content).toBe(messages?.[6]?.content);
    expect(result[4]?.content).toBe(messages?.[7]?.content);
    expect(result[5]?.content).toBe(messages?.[8]?.content);
  });

  it('should include first and last messages without overlap', () => {
    // Create messages
    const messages: Message[] = [
      createMessage('user', generateRandomString(100)), // First message
      createMessage('assistant', generateRandomString(100)), // Second message
      createMessage('user', generateRandomString(100)), // Last message
      createMessage('assistant', generateRandomString(100)),
    ];

    const result = limitChatHistory({
      messages,
      limitRecent: 2,
      limitFirst: 1,
      characterLimit: 300,
    });

    // Should include all messages
    expect(result.length).toBe(4);
    expect(result[0]?.content).toBe(messages?.[0]?.content);
    expect(result[1]?.content).toBe(messages?.[1]?.content);
    expect(result[2]?.content).toBe(messages?.[2]?.content);
    expect(result[3]?.content).toBe(messages?.[3]?.content);
  });

  it('should include most recent messages up to character limit after mandatory messages', () => {
    const messages: Message[] = [
      createMessage('user', generateRandomString(100)), // First message
      createMessage('assistant', generateRandomString(100)), // Second message
      createMessage('user', generateRandomString(70)), // Will be omitted
      createMessage('assistant', generateRandomString(1000)), // Will be omitted
      createMessage('user', generateRandomString(50)), // Will be included
      createMessage('assistant', generateRandomString(100)), // Last 4 messages
      createMessage('user', generateRandomString(100)),
      createMessage('assistant', generateRandomString(100)),
      createMessage('user', generateRandomString(100)),
    ];

    const result = limitChatHistory({
      messages,
      limitRecent: 2,
      limitFirst: 1,
      characterLimit: 700,
    });

    // Should include first 2 and and the last 4 as well as other messages possible within character limit
    expect(result.length).toBe(7);
    expect(result[0]?.content).toBe(messages?.[0]?.content);
    expect(result[1]?.content).toBe(messages?.[1]?.content);
    expect(result[2]?.content).toBe(messages?.[4]?.content);
    expect(result[3]?.content).toBe(messages?.[5]?.content);
    expect(result[4]?.content).toBe(messages?.[6]?.content);
    expect(result[5]?.content).toBe(messages?.[7]?.content);
    expect(result[6]?.content).toBe(messages?.[8]?.content);
  });

  it('should include all messages if character limit allows it', () => {
    const messages: Message[] = [
      createMessage('user', generateRandomString(1000)), // First message
      createMessage('assistant', generateRandomString(1000)), // Second message
      createMessage('user', generateRandomString(1000)),
      createMessage('assistant', generateRandomString(1000)),
      createMessage('user', generateRandomString(1000)), // Last 4 messages
      createMessage('assistant', generateRandomString(1000)),
      createMessage('user', generateRandomString(1000)),
      createMessage('assistant', generateRandomString(1000)),
    ];

    const result = limitChatHistory({
      messages,
      limitRecent: 2,
      limitFirst: 1,
      characterLimit: 10000,
    });

    expect(result.length).toBe(messages.length);
    expect(result).toEqual(messages);
  });
});
