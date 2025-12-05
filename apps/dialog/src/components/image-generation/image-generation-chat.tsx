'use client';

import React, { useState, useEffect } from 'react';
import { useImageModels } from '../providers/image-model-provider';
import { useImageStyle } from '../providers/image-style-provider';
import {
  generateImageAction,
  createImageConversationAction,
} from '@/app/(authed)/(dialog)/image-generation/actions';
import { ImageGenerationInputBox } from './image-generation-input-box';
import { useTranslations } from 'next-intl';
import LoadingAnimation from './loading-animation';
import { ConversationMessageModel } from '@shared/db/types';
import { useRouter } from 'next/navigation';

interface ImageGenerationChatProps {
  conversationId?: string;
  initialMessages?: ConversationMessageModel[];
  autoPrompt?: string;
}

export default function ImageGenerationChat({
  conversationId,
  initialMessages = [],
  autoPrompt,
}: ImageGenerationChatProps) {
  const router = useRouter();
  const { selectedModel } = useImageModels();
  const { selectedStyle } = useImageStyle();
  const tImageGeneration = useTranslations('image-generation');

  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentGeneratingPrompt, setCurrentGeneratingPrompt] = useState('');
  const [displayedImage, setDisplayedImage] = useState<{
    prompt: string;
    imageUrl: string;
  } | null>(null);

  // Load the single image from initial messages
  useEffect(() => {
    if (initialMessages.length >= 2) {
      const userMessage = initialMessages.find((msg) => msg.role === 'user');
      const assistantMessage = initialMessages.find(
        (msg) => msg.role === 'assistant' && msg.content.startsWith('http'),
      );

      if (userMessage && assistantMessage) {
        setDisplayedImage({
          prompt: userMessage.content,
          imageUrl: assistantMessage.content,
        });
      }
    }
  }, [initialMessages]);

  // Auto-generate image if prompt is provided in URL
  useEffect(() => {
    if (autoPrompt && conversationId && selectedModel && !displayedImage && !isGenerating) {
      setCurrentGeneratingPrompt(autoPrompt);
      setIsGenerating(true);

      generateImageAction({
        prompt: autoPrompt,
        modelName: selectedModel.name,
        style: selectedStyle,
        conversationId,
      })
        .then((result) => {
          setDisplayedImage({
            prompt: autoPrompt,
            imageUrl: result.imageUrl,
          });
        })
        .catch((error) => {
          console.error('Auto image generation failed:', error);
        })
        .finally(() => {
          setIsGenerating(false);
          setCurrentGeneratingPrompt('');
        });
    }
  }, [autoPrompt, conversationId, selectedModel, selectedStyle, displayedImage, isGenerating]);

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
  }

  async function customHandleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!input.trim() || !selectedModel || isGenerating) {
      return;
    }

    const currentPrompt = input.trim();
    setCurrentGeneratingPrompt(currentPrompt);
    setInput(''); // Clear input immediately
    setIsGenerating(true);

    try {
      if (!conversationId) {
        // We're on the main page - create conversation first, then navigate
        const newConversationId = await createImageConversationAction();
        router.push(
          `/image-generation/d/${newConversationId}?prompt=${encodeURIComponent(currentPrompt)}`,
        );
      } else {
        // We're on a conversation page - generate the image
        const result = await generateImageAction({
          prompt: currentPrompt,
          modelName: selectedModel.name,
          style: selectedStyle,
          conversationId,
        });

        // Update the displayed image
        setDisplayedImage({
          prompt: currentPrompt,
          imageUrl: result.imageUrl,
        });
      }
    } catch (error) {
      console.error('Image generation failed:', error);
      // TODO: Show error message to user
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
          {/* Display the single image for this conversation */}
          {displayedImage && (
            <div className="mt-6">
              <h3 className="text-xs text-gray-700">{tImageGeneration('prompt-label')}</h3>
              <p className="text-sm mb-3">{displayedImage.prompt}</p>
              <img
                src={displayedImage.imageUrl}
                alt={displayedImage.prompt}
                className="w-full rounded-xl"
              />
            </div>
          )}

          {/* Current generation in progress */}
          {isGenerating && (
            <div className="mt-6">
              <h3 className="text-xs text-gray-700">{tImageGeneration('prompt-label')}</h3>
              <p className="text-sm mb-3">{currentGeneratingPrompt}</p>
              <LoadingAnimation />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
