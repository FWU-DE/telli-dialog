'use client';

import { useCallback } from 'react';
import {
  useTelliChat,
  type ChatMessage,
  type SendMessageFn,
  type UseChatReturn,
} from './use-telli-chat';
import { sendChatMessage } from '@/app/api/chat/actions';
import { sendCharacterMessage } from '@/app/api/character/actions';
import { sendSharedChatMessage } from '@/app/api/shared-chat/actions';
import { type UIMessage, type ChatStatus, toUIMessages } from '@/types/chat';

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
}): UseChatReturn {
  const { conversationId, characterId, customGptId, ...rest } = options;

  const sendMessage: SendMessageFn = useCallback(
    async ({ messages, modelId, fileIds }) => {
      return sendChatMessage({
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
      return sendCharacterMessage({
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
      return sendSharedChatMessage({
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

/**
 * Convert ChatMessage[] to UIMessage[] for rendering.
 * @deprecated Since v1.2.0; will be removed in or after v2.0.0. Use toUIMessages from @/types/chat instead.
 */
export function convertToAiMessages(messages: ChatMessage[]): UIMessage[] {
  return toUIMessages(messages);
}
