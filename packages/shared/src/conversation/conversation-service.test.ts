import { beforeEach, describe, expect, it, MockedFunction, vi } from 'vitest';
import { getConversation, getConversationMessages } from './conversation-service';
import { ForbiddenError, NotFoundError } from '@shared/error';
import { generateUUID } from '@shared/utils/uuid';
import { dbGetConversationById, dbGetConversationMessages } from '@shared/db/functions/chat';
import { ConversationModel } from '@shared/db/types';

vi.mock('../db/functions/chat', () => ({
  dbGetConversationById: vi.fn(),
  dbGetConversationMessages: vi.fn(),
}));

describe('conversation-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConversation', () => {
    it('should throw because conversation not found', async () => {
      const userId = generateUUID();
      const conversationId = generateUUID();

      (dbGetConversationById as MockedFunction<typeof dbGetConversationById>).mockResolvedValue(
        null as never,
      );

      await expect(
        getConversation({
          conversationId,
          userId,
        }),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should throw because user is not owner of conversation', async () => {
      const userId = generateUUID();
      const conversationId = generateUUID();
      const mockConversation: Partial<ConversationModel> = {
        id: conversationId,
        userId: 'differentUserId',
      };

      (dbGetConversationById as MockedFunction<typeof dbGetConversationById>).mockResolvedValue(
        mockConversation as never,
      );

      await expect(
        getConversation({
          conversationId,
          userId,
        }),
      ).rejects.toThrowError(ForbiddenError);
    });
  });

  describe('getConversationMessages', () => {
    it('should call dbGetConversationMessages with correct parameters', async () => {
      const userId = generateUUID();
      const conversationId = generateUUID();
      const mockMessages: unknown[] = [];

      (
        dbGetConversationMessages as MockedFunction<typeof dbGetConversationMessages>
      ).mockResolvedValue(mockMessages as never);

      await getConversationMessages({
        conversationId,
        userId,
      });

      // we rely on this function to only return messages for the given user
      expect(dbGetConversationMessages).toHaveBeenCalledWith({
        conversationId,
        userId,
      });
    });

    it('should throw when database function rejects', async () => {
      const userId = generateUUID();
      const conversationId = generateUUID();

      (
        dbGetConversationMessages as MockedFunction<typeof dbGetConversationMessages>
      ).mockRejectedValue(new NotFoundError('Messages not found'));

      await expect(
        getConversationMessages({
          conversationId,
          userId,
        }),
      ).rejects.toThrowError(NotFoundError);
    });
  });
});
