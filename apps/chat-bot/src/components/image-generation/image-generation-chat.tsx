'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useImageModels } from '../providers/image-model-provider';
import { useImageStyle } from '../providers/image-style-provider';
import { generateImageAction } from '@/app/(authed)/(chat-bot)/image-generation/actions';
import { ImageGenerationInputBox } from './image-generation-input-box';
import { ImageActionButtons } from './image-action-buttons';
import { ImageGenerationError } from './image-generation-error';
import { ImageAssistant } from './image-assistant';
import { ImageEditAssistant } from './image-edit-assistant';
import { useTranslations } from 'next-intl';
import LoadingAnimation from './loading-animation';
import { ConversationMessageModel } from '@shared/db/types';
import { getReadOnlySignedUrlAction } from '@/app/api/file-operations/actions';
import { FileModel } from '@shared/db/schema';
import { useQueryClient } from '@tanstack/react-query';
import { logError } from '@shared/logging';
import { ResponsibleAIError } from '@ais-chat/ai-core/errors';
import Image from 'next/image';
import { navigateWithoutRefresh } from '@/utils/navigation/router';
import { useImageAssistant } from '@/components/providers/image-assistant-provider';
import { Button } from '@ui/components/button';
import { MagicWandIcon } from '@phosphor-icons/react';

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
  const { selectedModel } = useImageModels();
  const { selectedStyle } = useImageStyle();
  const tImageGeneration = useTranslations('image-generation');

  const {
    isOpen: assistantOpen,
    setIsOpen: setAssistantOpen,
    isEnabled: isAssistantEnabled,
  } = useImageAssistant();
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');
  const [displayedImage, setDisplayedImage] = useState<{
    prompt: string;
    imageUrl: string;
    fileId: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editAssistantOpen, setEditAssistantOpen] = useState(false);
  const queryClient = useQueryClient();
  const imageRef = useRef<HTMLImageElement>(null);
  const [isImageReady, setIsImageReady] = useState(false);

  useEffect(() => {
    const loadImageFromFiles = async () => {
      if (initialMessages.length >= 2 && fileMapping) {
        const userMessage = initialMessages.find((msg) => msg.role === 'user');
        const assistantMessage = initialMessages.find((msg) => msg.role === 'assistant');

        if (userMessage && assistantMessage) {
          const attachedFiles = fileMapping.get(assistantMessage.id) || [];
          const imageFile = attachedFiles.find((file) => file.type.startsWith('image/'));

          if (imageFile) {
            try {
              const imageKey = `message_attachments/${imageFile.id}`;
              const signedUrl = await getReadOnlySignedUrlAction({
                key: imageKey,
                contentType: imageFile.type,
                attachment: false,
              });

              if (signedUrl) {
                setDisplayedImage({
                  prompt: userMessage.content,
                  imageUrl: signedUrl,
                  fileId: imageFile.id,
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

  async function generateImage(prompt: string) {
    if (!prompt.trim() || !selectedModel || isGenerating) return;

    const currentPrompt = prompt.trim();
    setLastPrompt(currentPrompt);
    setIsGenerating(true);
    setErrorMessage(null);

    const result = await generateImageAction({
      prompt: currentPrompt,
      model: selectedModel,
      style: selectedStyle,
    });
    if (result.success) {
      if (result.value.imageUrl) {
        setIsImageReady(false);
        setDisplayedImage({
          prompt: currentPrompt,
          imageUrl: result.value.imageUrl,
          fileId: result.value.fileId,
        });
      }

      const newConversationId = result.value.conversationId;
      if (conversationId === undefined || conversationId !== newConversationId) {
        navigateWithoutRefresh(`/image-generation/d/${newConversationId}`);
      }
      refetchConversations();
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

  async function customHandleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await generateImage(input);
  }

  return (
    <div className="flex flex-col h-full w-full">
      {isAssistantEnabled && (
        <>
          <ImageAssistant
            open={assistantOpen}
            onOpenChange={setAssistantOpen}
            onPromptGenerated={(prompt) => setInput(prompt)}
            onSubmitPrompt={(prompt) => void generateImage(prompt)}
            onInsertPrompt={(prompt) => setInput(prompt)}
            initialPrompt={input}
          />
          <ImageEditAssistant
            open={editAssistantOpen}
            onOpenChange={setEditAssistantOpen}
            onPromptGenerated={(prompt) => setInput(prompt)}
            originalPrompt={displayedImage?.prompt ?? ''}
            imageUrl={displayedImage?.imageUrl}
          />
        </>
      )}
      <div className="flex-1 flex flex-col justify-start p-6 w-full mx-auto">
        <ImageGenerationInputBox
          isLoading={isGenerating}
          handleInputChange={handleInputChange}
          customHandleSubmit={customHandleSubmit}
          input={input}
        />
        {isAssistantEnabled && (
          <div className="flex justify-end mt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAssistantOpen(true)}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
            >
              <MagicWandIcon className="size-4" weight="duotone" />
              {tImageGeneration('assistant-hint-button')}
            </Button>
          </div>
        )}
        <div className="w-3/4 mx-auto">
          {isGenerating && (
            <div className="mt-6">
              <h3 className="text-xs text-gray-700">{tImageGeneration('prompt-label')}</h3>
              <p className="text-sm mb-3">{lastPrompt}</p>
              <LoadingAnimation />
            </div>
          )}

          {errorMessage && !isGenerating && (
            <div className="mt-6">
              <h3 className="text-xs text-gray-700">{tImageGeneration('prompt-label')}</h3>
              <p className="text-sm mb-3">{lastPrompt}</p>
              <ImageGenerationError message={errorMessage} />
            </div>
          )}

          {displayedImage && !isGenerating && !errorMessage && (
            <div className="mt-6">
              <h3 className="text-xs text-gray-700">{tImageGeneration('prompt-label')}</h3>
              <p className="text-sm mb-3">{displayedImage.prompt}</p>
              <Image
                ref={imageRef}
                src={displayedImage.imageUrl}
                alt={displayedImage.prompt}
                data-testid="generated-image"
                className="w-full rounded-xl"
                width={800}
                height={800}
                loading="eager"
                unoptimized
                crossOrigin="anonymous"
                onLoad={() => setIsImageReady(true)}
              />
              <div className="flex items-center justify-between mt-2">
                <ImageActionButtons
                  imageRef={imageRef}
                  fileId={displayedImage.fileId}
                  prompt={displayedImage.prompt}
                  isImageReady={isImageReady}
                />
                {isAssistantEnabled && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditAssistantOpen(true)}
                    className="gap-1.5 shrink-0"
                  >
                    <MagicWandIcon className="size-4" weight="duotone" />
                    {tImageGeneration('edit-assistant-button')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
