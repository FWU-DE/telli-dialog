import { describe, it, expect } from 'vitest';
import { limitChatHistory } from './utils';
import { Message } from 'ai';

describe('limitChatHistory', () => {
  // Create a sample unbalanced conversation with more user messages than assistant messages
  const unbalancedHistory: Message[] = [
    { role: 'user', content: 'Hello!', id: '0' },
    { role: 'assistant', content: 'Hi there! How can I help you today?', id: '0' },
    { role: 'user', content: 'I have a question about TypeScript.', id: '1' },
    { role: 'user', content: 'Actually, can you explain React hooks?', id: '2' },
    {
      role: 'assistant',
      content:
        'React hooks are functions that let you use state and lifecycle features in functional components.',
      id: '3',
    },
    { role: 'user', content: 'What about useEffect?', id: '4' },
    { role: 'user', content: 'And useState?', id: '5' },
    {
      role: 'assistant',
      content: 'useEffect lets you perform side effects in function components.',
      id: '6',
    },
    { role: 'user', content: 'Thanks! One more thing about useContext?', id: '7' },
  ];

  it('should return the original array if messages length is less than limit', () => {
    const result = limitChatHistory({
      messages: unbalancedHistory.slice(0, 5),
      limitRecent: 10,
    });
    expect(result).toHaveLength(4);
  });

  it('should throw an error if limit is not even', () => {
    expect(() =>
      limitChatHistory({
        messages: unbalancedHistory,
        limitRecent: 5,
      }),
    ).toThrow();
  });

  it('should keep the first message by default and balance the rest', () => {
    const result = limitChatHistory({
      messages: unbalancedHistory,
      limitRecent: 6,
    });

    // join consecutive messages
    expect(result).toHaveLength(7);
    expect(result[0]).toEqual(unbalancedHistory[0]); // System message

    // Count roles in the result
    const userCount = result.filter((m) => m.role === 'user').length;
    const assistantCount = result.filter((m) => m.role === 'assistant').length;
    expect(userCount).toBeLessThanOrEqual(4); // At most 4 user messages
    expect(assistantCount).toBeGreaterThanOrEqual(2); // At least 3 assistant messages

    // Should include most recent messages of each type
    expect(result).toContainEqual(unbalancedHistory.at(-1)); // Most recent user message
    expect(result).toContainEqual(unbalancedHistory.at(-2)); // Most recent assistant message
  });

  it('should keep first n messages intact when keepFirstN is specified', () => {
    const result = limitChatHistory({
      messages: unbalancedHistory,
      limitRecent: 8,
      limitFirst: 3,
    });

    expect(result).toHaveLength(7);

    // First 3 messages should be preserved in order
    expect(result[0]).toEqual(unbalancedHistory[0]);
    expect(result[2]?.content).toEqual(
      `${unbalancedHistory[2]?.content}\n\n${unbalancedHistory[3]?.content}`,
    );
    expect(result[3]).toEqual(unbalancedHistory[4]);

    // Count roles in the remaining results
    const remainingMessages = result.slice(3);
    const userCount = remainingMessages.filter((m) => m.role === 'user').length;
    const assistantCount = remainingMessages.filter((m) => m.role === 'assistant').length;

    // Should be roughly balanced with preference for most recent
    expect(userCount + assistantCount).toBe(4);

    // Should include most recent messages
    expect(result).toContainEqual(unbalancedHistory.at(-1)); // Most recent user
    expect(result).toContainEqual(unbalancedHistory.at(-1)); // Most recent assistant
  });
});

describe('limitChatHistory', () => {
  // Create a balanced conversation with alternating user and assistant messages
  const balancedHistory: Message[] = [
    { role: 'user', content: 'Hello!', id: '0' },
    { role: 'assistant', content: 'Hi there! How can I help you today?', id: '1' },
    { role: 'user', content: 'I have a question about TypeScript.', id: '2' },
    { role: 'assistant', content: 'Sure, what would you like to know about TypeScript?', id: '3' },
    { role: 'user', content: 'How do interfaces work?', id: '4' },
    {
      role: 'assistant',
      content: 'Interfaces in TypeScript define the shape of objects and provide type checking.',
      id: '5',
    },
    { role: 'user', content: 'What about generics?', id: '6' },
    {
      role: 'assistant',
      content:
        'Generics allow you to create reusable components that work with a variety of types.',
      id: '7',
    },
    { role: 'user', content: 'Thanks! That was helpful.', id: '8' },
    {
      role: 'assistant',
      content: "You're welcome! Let me know if you have any other questions.",
      id: '8',
    },
    {
      role: 'user',
      content: 'This is the most recent user question',
      id: '9',
    },
  ];

  // Tests for balanced history
  it('should handle balanced conversation with alternating messages', () => {
    const result = limitChatHistory({
      messages: balancedHistory,
      limitRecent: 2,
      limitFirst: 2,
    });

    expect(result).toHaveLength(5);

    // First message should be preserved
    expect(result[0]).toEqual(balancedHistory[0]);

    // Count roles in the result (excluding the system message)
    const userCount = result.filter((m) => m.role === 'user').length;
    const assistantCount = result.filter((m) => m.role === 'assistant').length;

    // Should have one more user message, since the most recent user message comes last
    expect(userCount).toBe(assistantCount + 1);

    // Should include most recent messages
    expect(result).toContainEqual(balancedHistory.at(-2)); // Recent user message
    expect(result).toContainEqual(balancedHistory.at(-1)); // Recent assistant message
  });

  it('should maintain chronological order in balanced conversation', () => {
    const result = limitChatHistory({
      messages: balancedHistory,
      limitRecent: 2,
      limitFirst: 4,
    });

    expect(result).toHaveLength(7);

    // Check that the order matches the original chronological order
    for (let i = 1; i < result.length; i++) {
      const resultIndex = balancedHistory.findIndex(
        (m) => m.role === result[i]?.role && m.content === result[i]?.content,
      );
      const prevResultIndex = balancedHistory.findIndex(
        (m) => m.role === result[i - 1]?.role && m.content === result[i - 1]?.content,
      );

      expect(resultIndex).toBeGreaterThan(prevResultIndex);
    }
  });

  // Test for keeping first n messages in a balanced conversation
  it('should keep first n messages intact in balanced conversation', () => {
    const result = limitChatHistory({
      messages: balancedHistory,
      limitRecent: 2,
      limitFirst: 4,
    });

    expect(result).toHaveLength(7);

    // First 3 messages should be preserved in order
    expect(result[0]).toEqual(balancedHistory[0]);
    expect(result[1]).toEqual(balancedHistory[1]);
    expect(result[2]).toEqual(balancedHistory[2]);

    // Should have most recent messages for the remaining slots
    expect(result).toContainEqual(balancedHistory.at(-1)); // Most recent assistant
    expect(result).toContainEqual(balancedHistory.at(-2)); // Most recent user
  });
});
