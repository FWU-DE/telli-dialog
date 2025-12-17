'use client';

import React, { useState, useEffect } from 'react';
import { useImageModels } from '../providers/image-model-provider';
import { useImageStyle } from '../providers/image-style-provider';
import {
  generateImageAction,
  createImageConversationAction,
} from '@/app/(authed)/(dialog)/image-generation/actions';
import { ImageGenerationInputBox } from './image-generation-input-box';
import { ImageActionButtons } from './image-action-buttons';
import { useTranslations } from 'next-intl';
import LoadingAnimation from './loading-animation';
import { ConversationMessageModel } from '@shared/db/types';
import { navigateWithoutRefresh } from '@/utils/navigation/router';
import { getSignedUrlFromS3Get } from '@shared/s3';
import { FileModel } from '@shared/db/schema';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../common/toast';
import { logError } from '@shared/logging';
import deleteConversationAction from '@/app/(authed)/(dialog)/actions';
import { ResponsibleAIError } from '@telli/ai-core/images/errors';

interface ImageGenerationChatProps {
  conversationId?: string;
  initialMessages?: ConversationMessageModel[];
  fileMapping?: Map<string, FileModel[]>;
}

export default function ImageGenerationChat({
  initialMessages = [],
  fileMapping,
}: ImageGenerationChatProps) {
  const { selectedModel } = useImageModels();
  const { selectedStyle } = useImageStyle();
  const tImageGeneration = useTranslations('image-generation');
  const toast = useToast();

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingPrompt, setCurrentGeneratingPrompt] = useState('');
  const [displayedImage, setDisplayedImage] = useState<{
    prompt: string;
    imageUrl: string;
  } | null>(null);
  const queryClient = useQueryClient();

  // Load the single image from initial messages and file attachments
  useEffect(() => {
    const loadImageFromFiles = async () => {
      if (initialMessages.length >= 2 && fileMapping) {
        const userMessage = initialMessages.find((msg) => msg.role === 'user');
        const assistantMessage = initialMessages.find((msg) => msg.role === 'assistant');

        if (userMessage && assistantMessage) {
          // Get files attached to the assistant message
          const attachedFiles = fileMapping.get(assistantMessage.id) || [];
          const imageFile = attachedFiles.find((file) => file.type.startsWith('image/'));

          if (imageFile) {
            try {
              // Generate signed URL for the image file
              const signedUrl = await getSignedUrlFromS3Get({
                key: `message_attachments/${imageFile.id}`,
                contentType: imageFile.type,
                attachment: false,
              });

              setDisplayedImage({
                prompt: userMessage.content,
                imageUrl: signedUrl,
              });
            } catch (error) {
              logError('Error loading image from files:', error);
            }
          }
        }
      }
    };

    loadImageFromFiles();
  }, [initialMessages, fileMapping]);

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
  }

  function refetchConversations() {
    void queryClient.invalidateQueries({ queryKey: ['conversations'] });
  }

  async function customHandleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!input.trim() || !selectedModel || isGenerating) {
      return;
    }

    const currentPrompt = input.trim();
    setCurrentGeneratingPrompt(currentPrompt);
    setIsGenerating(true);

    let newConversationId;

    try {
      // Every image generation gets its own conversation
      newConversationId = await createImageConversationAction(currentPrompt);

      const result = await generateImageAction({
        prompt: currentPrompt,
        model: selectedModel,
        style: selectedStyle,
        conversationId: newConversationId,
      });

      // Update the displayed image
      setDisplayedImage({
        prompt: currentPrompt,
        imageUrl: result.imageUrl,
      });
      setInput('');
      navigateWithoutRefresh(`/image-generation/d/${newConversationId}`);
      refetchConversations();
    } catch (error) {
      if (ResponsibleAIError.is(error)) {
        toast.error(tImageGeneration('responsible-ai-error'));
      } else {
        toast.error(tImageGeneration('generation-error'));
      }
      logError('Error generating image:', error);

      if (newConversationId) {
        try {
          await deleteConversationAction({ conversationId: newConversationId });
          refetchConversations();
        } catch (deletionError) {
          logError('Error deleting failed image conversation:', deletionError);
        }
      }
    } finally {
      setIsGenerating(false);
      setCurrentGeneratingPrompt('');
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 flex flex-col justify-start p-6 w-full max-w-3xl mx-auto">
        <ImageGenerationInputBox
          isLoading={isGenerating}
          handleInputChange={handleInputChange}
          customHandleSubmit={customHandleSubmit}
          input={input}
        />
        <div className="w-3/4 mx-auto">
          {/* Current generation in progress */}
          {isGenerating && (
            <div className="mt-6">
              <h3 className="text-xs text-gray-700">{tImageGeneration('prompt-label')}</h3>
              <p className="text-sm mb-3">{currentGeneratingPrompt}</p>
              <LoadingAnimation />
            </div>
          )}
          {/* Display the single image for this conversation */}
          {displayedImage && !isGenerating && (
            <div className="mt-6">
              <h3 className="text-xs text-gray-700">{tImageGeneration('prompt-label')}</h3>
              <p className="text-sm mb-3">{displayedImage.prompt}</p>
              <img
                src={displayedImage.imageUrl}
                alt={displayedImage.prompt}
                className="w-full rounded-xl"
              />
              <ImageActionButtons
                imageUrl={displayedImage.imageUrl}
                prompt={displayedImage.prompt}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
