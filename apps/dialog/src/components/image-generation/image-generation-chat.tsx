'use client';

import React, { useState } from 'react';
import { useImageModels } from '../providers/image-model-provider';
import { generateImageAction } from '@/app/(authed)/(dialog)/image-generation/actions';
import { ImageGenerationInputBox } from './image-generation-input-box';
import { useTranslations } from 'next-intl';
import LoadingAnimation from './loading-animation';

export default function ImageGenerationChat() {
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastPrompt, setLastPrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const { selectedModel } = useImageModels();
  const tImageGeneration = useTranslations('image-generation');

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
  }

  async function customHandleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!input.trim() || !selectedModel || isGenerating) {
      return;
    }

    const currentPrompt = input.trim();
    setLastPrompt(currentPrompt);
    setIsGenerating(true);

    try {
      const imageUrl = await generateImageAction({
        prompt: currentPrompt,
        modelName: selectedModel.name,
      });

      // Save the generated image URL
      setGeneratedImageUrl(imageUrl);

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
        <ImageGenerationInputBox
          isLoading={isGenerating}
          handleInputChange={handleInputChange}
          customHandleSubmit={customHandleSubmit}
          input={input}
        />
        <div className="w-3/4 mx-auto">
          {/* Display last prompt when generating or image is finished */}
          {lastPrompt && (
            <div className="mt-6">
              <h3 className="text-xs text-gray-700">{tImageGeneration('prompt-label')}</h3>
              <p className="text-sm">{lastPrompt}</p>
            </div>
          )}

          <div className="mt-3">
            {/* Generated Images Display Area */}
            {isGenerating && <LoadingAnimation />}

            {/* Display generated image when available */}
            {generatedImageUrl && !isGenerating && (
              <img src={generatedImageUrl} alt={lastPrompt} className="w-full rounded-xl" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
