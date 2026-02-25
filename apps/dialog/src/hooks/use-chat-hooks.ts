'use client';

import { useCallback } from 'react';
import {
  useTelliChat,
  type ChatMessage,
  type SendMessageFn,
  type UseChatReturn,
} from './use-telli-chat';
import { sendChatMessageAction } from '@/app/api/chat/actions';
import { sendCharacterMessageAction } from '@/app/api/character/actions';
import { sendSharedChatMessageAction } from '@/app/api/shared-chat/actions';
import { type UIMessage, type ChatStatus } from '@/types/chat';

// Re-export types for convenience
export type { ChatMessage, ChatStatus, UseChatReturn, UIMessage };

/**
 * Hook for main chat (with optional character/customGpt)
 */
export function useMainChat(options: {
  conversationId: string;
  initialMessages?: ChatMessage[];
  modelId?: string;
  characterId?: string;
  customGptId?: string;
  onError?: (error: Error) => void;
  onFinish?: (message: ChatMessage) => void;
  onMessageCreated?: (messageId: string) => void;
}): UseChatReturn {
  const { conversationId, characterId, customGptId, ...rest } = options;

  const sendMessage: SendMessageFn = useCallback(
    async ({ messages, modelId, fileIds }) => {
      return sendChatMessageAction({
        conversationId,
        messages,
        modelId,
        characterId,
        customGptId,
        fileIds,
      });
    },
    [conversationId, characterId, customGptId],
  );

  return useTelliChat({
    sendMessage,
    ...rest,
  });
}

/**
 * Hook for character chat (shared character)
 */
export function useCharacterChat(options: {
  characterId: string;
  inviteCode: string;
  initialMessages?: ChatMessage[];
  modelId?: string;
  onError?: (error: Error) => void;
  onFinish?: (message: ChatMessage) => void;
}): UseChatReturn {
  const { characterId, inviteCode, ...rest } = options;

  const sendMessage: SendMessageFn = useCallback(
    async ({ messages, modelId }) => {
      return sendCharacterMessageAction({
        characterId,
        inviteCode,
        messages,
        modelId,
      });
    },
    [characterId, inviteCode],
  );

  return useTelliChat({
    sendMessage,
    ...rest,
  });
}

/**
 * Hook for shared school chat (learning scenario)
 */
export function useSharedChat(options: {
  sharedChatId: string;
  inviteCode: string;
  initialMessages?: ChatMessage[];
  modelId?: string;
  onError?: (error: Error) => void;
  onFinish?: (message: ChatMessage) => void;
}): UseChatReturn {
  const { sharedChatId, inviteCode, ...rest } = options;

  const sendMessage: SendMessageFn = useCallback(
    async ({ messages, modelId }) => {
      return sendSharedChatMessageAction({
        sharedChatId,
        inviteCode,
        messages,
        modelId,
      });
    },
    [sharedChatId, inviteCode],
  );

  return useTelliChat({
    sendMessage,
    ...rest,
  });
}
