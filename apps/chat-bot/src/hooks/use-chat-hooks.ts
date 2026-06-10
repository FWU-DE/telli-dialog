'use client';

import { useCallback } from 'react';
import {
  useAisChat,
  type ChatMessage,
  type SendMessageFn,
  type UseChatReturn,
} from './use-ais-chat';
import { sendChatMessageAction } from '@/app/api/chat/actions';
import { sendCharacterMessageAction } from '@/app/api/character/actions';
import { sendLearningScenarioMessageAction } from '@/app/api/learning-scenario/actions';
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
  learningScenarioId?: string;
  assistantId?: string;
  onError?: (error: Error) => void;
  onFinish?: (message: ChatMessage) => void;
  onMessageCreated?: (messageId: string) => void;
}): UseChatReturn {
  const { conversationId, characterId, learningScenarioId, assistantId, ...rest } = options;

  const sendMessage: SendMessageFn = useCallback(
    async ({ messages, modelId, fileIds }) => {
      return sendChatMessageAction({
        conversationId,
        messages,
        modelId,
        characterId,
        learningScenarioId,
        assistantId,
        fileIds,
      });
    },
    [conversationId, characterId, learningScenarioId, assistantId],
  );

  return useAisChat({
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

  return useAisChat({
    sendMessage,
    ...rest,
  });
}

/**
 * Hook for shared school chat (learning scenario)
 */
export function useLearningScenarioChat(options: {
  learningScenarioId: string;
  inviteCode: string;
  initialMessages?: ChatMessage[];
  modelId?: string;
  onError?: (error: Error) => void;
  onFinish?: (message: ChatMessage) => void;
}): UseChatReturn {
  const { learningScenarioId, inviteCode, ...rest } = options;

  const sendMessage: SendMessageFn = useCallback(
    async ({ messages, modelId }) => {
      return sendLearningScenarioMessageAction({
        learningScenarioId,
        inviteCode,
        messages,
        modelId,
      });
    },
    [learningScenarioId, inviteCode],
  );

  return useAisChat({
    sendMessage,
    ...rest,
  });
}
