import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
}));

vi.mock('..', () => ({
  db: {
    select: mocks.select,
  },
}));

import {
  dbGetAssistantById,
  dbGetAssistantByIdForConversation,
  dbGetAssistantsByIds,
} from './assistants';
import { NotFoundError } from '@shared/error';

function mockSelectChain(result: unknown[]) {
  const chain: Record<string, unknown> = {
    from: vi.fn(() => chain),
    leftJoin: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    orderBy: vi.fn(() => chain),
    then: (resolve: (value: unknown[]) => void) => resolve(result),
  };
  mocks.select.mockReturnValue(chain);
  return chain;
}

describe('db assistant helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('dbGetAssistantById', () => {
    it('returns the assistant when found', async () => {
      const assistant = { id: 'assistant-1', name: 'Assistant' };
      mockSelectChain([assistant]);

      const result = await dbGetAssistantById({ assistantId: 'assistant-1' });

      expect(result).toBe(assistant);
    });

    it('throws NotFoundError when no assistant matches', async () => {
      mockSelectChain([]);

      await expect(dbGetAssistantById({ assistantId: 'missing' })).rejects.toThrow(NotFoundError);
    });
  });

  describe('dbGetAssistantByIdForConversation', () => {
    it('returns the assistant when it is linked to the conversation', async () => {
      const assistant = { id: 'assistant-1', name: 'Assistant' };
      mockSelectChain([assistant]);

      const result = await dbGetAssistantByIdForConversation({
        assistantId: 'assistant-1',
        conversationId: 'conversation-1',
        userId: 'user-1',
      });

      expect(result).toBe(assistant);
    });

    it('returns undefined when the assistant is not linked to the conversation', async () => {
      mockSelectChain([]);

      const result = await dbGetAssistantByIdForConversation({
        assistantId: 'assistant-1',
        conversationId: 'conversation-1',
        userId: 'user-1',
      });

      expect(result).toBeUndefined();
    });
  });

  describe('dbGetAssistantsByIds', () => {
    it('returns an empty array without querying the db when given no ids', async () => {
      const result = await dbGetAssistantsByIds({ assistantIds: [] });

      expect(result).toEqual([]);
      expect(mocks.select).not.toHaveBeenCalled();
    });
  });
});
