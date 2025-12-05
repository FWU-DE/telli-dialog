'use client';

import React, { useState } from 'react';
import { useImageModels } from '../providers/image-model-provider';
import { generateImageAction } from '@/app/(authed)/(dialog)/image-generation/actions';
import { ChatInputBox } from '../chat/chat-input-box';
import { useTranslations } from 'next-intl';
import LoadingAnimation from './loading-animation';

export default function ImageGenerationChat() {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { selectedModel } = useImageModels();
  const tCommon = useTranslations('common');

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
  }

  function handleStopGeneration() {
    // TODO: Implement stopping image generation if needed
    setIsGenerating(false);
  }

  async function customHandleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!input.trim() || !selectedModel || isGenerating) {
      return;
    }

    setIsGenerating(true);
    try {
      // TODO: This will call the actual image generation when implemented
      await generateImageAction({
        prompt: input.trim(),
        modelId: selectedModel.id,
      });

      // Clear input after successful generation
      setInput('');
    } catch (error) {
      console.error('Image generation failed:', error);
      // TODO: Show error message to user
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 flex flex-col justify-start p-6 w-full max-w-3xl mx-auto">
        <ChatInputBox
          isLoading={isGenerating}
          handleInputChange={handleInputChange}
          handleStopGeneration={handleStopGeneration}
          customHandleSubmit={customHandleSubmit}
          input={input}
          enableFileUpload={false}
        />
        {/* TODO: Generated Images Display Area */}
        {/* This will show the history of generated images */}
        {isGenerating && <LoadingAnimation />}
      </div>
    </div>
  );
}
