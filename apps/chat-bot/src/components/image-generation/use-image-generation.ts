'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { LlmModelSelectModel } from '@shared/db/schema';
import { ImageStyle } from '@shared/utils/chat';
import { ResponsibleAIError } from '@ais-chat/ai-core/errors';
import { generateImageAction } from '@/app/(authed)/(chat-bot)/image-generation/actions';
import { navigateWithoutRefresh } from '@/utils/navigation/router';
import { ImageAspectRatioPreset } from './image-generation-types';

interface UseImageGenerationArgs {
  initialConversationId?: string;
  selectedModel: LlmModelSelectModel | undefined;
  selectedStyle: ImageStyle | undefined;
  aspectRatio: ImageAspectRatioPreset;
}

interface GenerateParams {
  prompt: string;
  inputFileIds: string[];
}

export interface GeneratedImagePayload {
  userMessageId: string;
  assistantMessageId: string;
  prompt: string;
  imageUrl: string;
  imageFileId: string;
}

interface UseImageGenerationResult {
  isGenerating: boolean;
  errorMessage: string | null;
  clearError: () => void;
  generate: (params: GenerateParams) => Promise<GeneratedImagePayload | null>;
}

export function useImageGeneration({
  initialConversationId,
  selectedModel,
  selectedStyle,
  aspectRatio,
}: UseImageGenerationArgs): UseImageGenerationResult {
  const t = useTranslations('image-generation');
  const queryClient = useQueryClient();

  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>(
    initialConversationId,
  );

  async function generate({
    prompt,
    inputFileIds,
  }: GenerateParams): Promise<GeneratedImagePayload | null> {
    if (!selectedModel) return null;

    const normalizedPrompt = prompt.trim();
    setErrorMessage(null);
    setIsGenerating(true);

    const result = await generateImageAction({
      prompt: normalizedPrompt,
      model: selectedModel,
      style: selectedStyle,
      options: { aspectRatio },
      inputFileIds,
      conversationId: currentConversationId,
    });

    let payload: GeneratedImagePayload | null = null;

    if (result.success) {
      const newConversationId = result.value.conversationId;
      setCurrentConversationId(newConversationId);
      if (initialConversationId === undefined || initialConversationId !== newConversationId) {
        navigateWithoutRefresh(`/image-generation/d/${newConversationId}`);
      }
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });

      if (result.value.imageUrl) {
        payload = {
          userMessageId: result.value.userMessageId,
          assistantMessageId: result.value.assistantMessageId,
          prompt: normalizedPrompt,
          imageUrl: result.value.imageUrl,
          imageFileId: result.value.fileId,
        };
      }
    } else if (ResponsibleAIError.is(result.error)) {
      setErrorMessage(t('responsible-ai-error'));
    } else {
      setErrorMessage(t('generation-error'));
    }

    setIsGenerating(false);
    return payload;
  }

  return {
    isGenerating,
    errorMessage,
    clearError: () => setErrorMessage(null),
    generate,
  };
}
