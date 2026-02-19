'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useImageModels } from '../providers/image-model-provider';
import { useImageStyle } from '../providers/image-style-provider';
import { generateImageAction } from '@/app/(authed)/(dialog)/image-generation/actions';
import { ImageGenerationInputBox } from './image-generation-input-box';
import { ImageActionButtons } from './image-action-buttons';
import { ImageGenerationError } from './image-generation-error';
import { useTranslations } from 'next-intl';
import LoadingAnimation from './loading-animation';
import { ConversationMessageModel } from '@shared/db/types';
import { getReadOnlySignedUrlAction } from '@/app/api/file-operations/actions';
import { FileModel } from '@shared/db/schema';
import { useQueryClient } from '@tanstack/react-query';
import { logError } from '@shared/logging';
import { ResponsibleAIError } from '@telli/ai-core/errors';
import Image from 'next/image';

interface ImageGenerationChatProps {
  conversationId?: string;
  initialMessages?: ConversationMessageModel[];
  fileMapping?: Map<string, FileModel[]>;
}

export default function ImageGenerationChat({
  conversationId,
  initialMessages = [],
  fileMapping,
}: ImageGenerationChatProps) {
  const router = useRouter();
  const { selectedModel } = useImageModels();
  const { selectedStyle } = useImageStyle();
  const tImageGeneration = useTranslations('image-generation');

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');
  const [displayedImage, setDisplayedImage] = useState<{
    prompt: string;
    imageUrl: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const imageRef = useRef<HTMLImageElement>(null);
  // isImageReady indicates if the image is loaded and visible in the browser
  const [isImageReady, setIsImageReady] = useState(false);

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
              const signedUrl = await getReadOnlySignedUrlAction({
                key: `message_attachments/${imageFile.id}`,
                contentType: imageFile.type,
                attachment: false,
              });

              if (signedUrl) {
                setDisplayedImage({
                  prompt: userMessage.content,
                  imageUrl: signedUrl,
                });
              }
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
    setLastPrompt(currentPrompt);
    setIsGenerating(true);
    setErrorMessage(null);

    const result = await generateImageAction({
      prompt: currentPrompt,
      model: selectedModel,
      style: selectedStyle,
    });
    if (result.success) {
      // Update the displayed image
      if (result.value.imageUrl) {
        setDisplayedImage({
          prompt: currentPrompt,
          imageUrl: result.value.imageUrl,
        });
      }

      const newConversationId = result.value.conversationId;
      /* TODO: improve navigation without full reload, but without causing issues with state.
       * Using router.push here causes the component to remount,
       * causing the image to flicker.
       * But using something like navigateWithoutReload causes
       * the same remount but after the following request
       * (possibly deleting an error message).
       * This is undocumented behavior in Next.js
       * (Documentation says window.history.replaceState should work without remounting).
       * https://nextjs.org/docs/app/getting-started/linking-and-navigating#native-history-api
       */
      if (conversationId === undefined || conversationId !== newConversationId) {
        router.push(`/image-generation/d/${newConversationId}`);
      }
      refetchConversations();
      // Clear the input after a successful generation
      setInput('');
    } else {
      const error = result.error;
      if (ResponsibleAIError.is(error)) {
        setErrorMessage(tImageGeneration('responsible-ai-error'));
      } else {
        setErrorMessage(tImageGeneration('generation-error'));
      }
    }
    setIsGenerating(false);
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
              <p className="text-sm mb-3">{lastPrompt}</p>
              <LoadingAnimation />
            </div>
          )}

          {/* Error state */}
          {errorMessage && !isGenerating && (
            <div className="mt-6">
              <h3 className="text-xs text-gray-700">{tImageGeneration('prompt-label')}</h3>
              <p className="text-sm mb-3">{lastPrompt}</p>
              <ImageGenerationError message={errorMessage} />
            </div>
          )}

          {/* Display the single image for this conversation */}
          {displayedImage && !isGenerating && !errorMessage && (
            <div className="mt-6">
              <h3 className="text-xs text-gray-700">{tImageGeneration('prompt-label')}</h3>
              <p className="text-sm mb-3">{displayedImage.prompt}</p>
              <Image
                ref={imageRef}
                src={displayedImage.imageUrl}
                alt={displayedImage.prompt}
                className="w-full rounded-xl"
                width={800}
                height={800}
                loading="eager"
                unoptimized={true} // Since we're using signed URLs from S3
                crossOrigin="anonymous" // Needed for clipboard copy to work
                onLoadingComplete={() => setIsImageReady(true)}
              />
              <ImageActionButtons
                imageRef={imageRef}
                prompt={displayedImage.prompt}
                isImageReady={isImageReady}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
