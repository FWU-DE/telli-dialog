import { describe, it, expect } from 'vitest';
import { limitChatHistory } from './utils';
import { Message } from 'ai';

const characterLimit = 2000;

// Helper function to generate random string of specified length
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper function to create a message
function createMessage(role: 'user' | 'assistant', content: string): Message {
  return { role, content, id: generateRandomString(10) };
}

describe('limitChatHistory', () => {
  it('should include first 2 and last 4 messages regardless of content length', () => {
    // Create messages with varying lengths
    const messages: Message[] = [
      createMessage('user', generateRandomString(1000)), // First message
      createMessage('assistant', generateRandomString(1000)), // Second message
      createMessage('user', generateRandomString(1000)), // Will be omitted
      createMessage('assistant', generateRandomString(1000)), // Will be omitted
      createMessage('user', generateRandomString(1000)), // Last 4 messages
      createMessage('assistant', generateRandomString(1000)),
      createMessage('user', generateRandomString(1000)),
      createMessage('assistant', generateRandomString(1000)),
    ];

    const result = limitChatHistory({
      messages,
      limitRecent: 2,
      limitFirst: 1,
      characterLimit,
    });

    // Should include first 2 and last 4 messages
    expect(result.length).toBe(7);
    expect(result[0]?.content).toBe(messages?.[0]?.content);
    expect(result[1]?.content).toBe(messages?.[1]?.content);
    expect(result[2]?.content).toBe(messages?.[3]?.content);
    expect(result[3]?.content).toBe(messages?.[4]?.content);
    expect(result[4]?.content).toBe(messages?.[5]?.content);
    expect(result[5]?.content).toBe(messages?.[6]?.content);
  });

  it('should include most recent messages up to character limit after mandatory messages', () => {
    const messages: Message[] = [
      createMessage('user', generateRandomString(100)), // First message
      createMessage('assistant', generateRandomString(100)), // Second message
      createMessage('user', generateRandomString(1000)), // Will be omitted
      createMessage('assistant', generateRandomString(1000)), // Will be omitted
      createMessage('user', generateRandomString(100)), // Last 4 messages
      createMessage('assistant', generateRandomString(100)),
      createMessage('user', generateRandomString(100)),
      createMessage('assistant', generateRandomString(100)),
    ];

    const result = limitChatHistory({
      messages,
      limitRecent: 2,
      limitFirst: 1,
      characterLimit: 500, // Set a lower character limit
    });

    // Should include first 2 and as many of the last 4 as possible within character limit
    expect(result.length).toBeLessThanOrEqual(7);
    expect(result[0]?.content).toBe(messages?.[0]?.content);
    expect(result[1]?.content).toBe(messages?.[1]?.content);
  });

  it('should handle messages that exceed character limit even with mandatory messages', () => {
    const messages: Message[] = [
      createMessage('user', generateRandomString(1000)), // First message
      createMessage('assistant', generateRandomString(1000)), // Second message
      createMessage('user', generateRandomString(1000)), // Will be omitted
      createMessage('assistant', generateRandomString(1000)), // Will be omitted
      createMessage('user', generateRandomString(1000)), // Last 4 messages
      createMessage('assistant', generateRandomString(1000)),
      createMessage('user', generateRandomString(1000)),
      createMessage('assistant', generateRandomString(1000)),
    ];

    const result = limitChatHistory({
      messages,
      limitRecent: 2,
      limitFirst: 1,
      characterLimit: 1500, // Set a character limit that can't fit all mandatory messages
    });

    // Should still include first 2 messages and as many of the last 4 as possible
    expect(result.length).toBeLessThanOrEqual(7);
    expect(result[0]?.content).toBe(messages?.[0]?.content);
    expect(result[1]?.content).toBe(messages?.[1]?.content);
  });
});
