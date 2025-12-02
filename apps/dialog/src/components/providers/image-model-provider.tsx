'use client';

import { LlmModel } from '@shared/db/schema';
import React from 'react';
import { saveImageModelForUserAction } from '@/app/(authed)/(dialog)/image-generation/actions';

type ImageModelsProviderProps = {
  models: LlmModel[];
  defaultImageModel: string | undefined;
  children: React.ReactNode;
};

type ImageModelsContextProps = {
  models: LlmModel[];
  selectedModel: LlmModel | undefined;
  setSelectedModel: (model: LlmModel) => Promise<void>;
};

const ImageModelsContext = React.createContext<ImageModelsContextProps | undefined>(undefined);

function getFirstImageModel(models: LlmModel[]): LlmModel | undefined {
  return models.find((model) => model.priceMetadata.type === 'image');
}

export function ImageModelsProvider({
  models,
  children,
  defaultImageModel,
}: ImageModelsProviderProps) {
  const selectedModel = getSelectedModel({ models, defaultImageModel });

  async function setSelectedModel(model: LlmModel) {
    // TODO: This will save the user's preferred image model once implemented
    try {
      await saveImageModelForUserAction(model.name);
    } catch (error) {
      console.error('Failed to save image model preference:', error);
    }
  }

  return (
    <ImageModelsContext.Provider value={{ models, selectedModel, setSelectedModel }}>
      {children}
    </ImageModelsContext.Provider>
  );
}

export function useImageModels(): ImageModelsContextProps {
  const maybeContext = React.useContext(ImageModelsContext);

  if (maybeContext === undefined) {
    throw Error('useImageModels can only be used inside a ImageModelsProvider');
  }
  return maybeContext;
}

function getSelectedModel({
  models,
  defaultImageModel,
}: {
  models: LlmModel[];
  defaultImageModel: string | undefined;
}) {
  return models.find((model) => model.name === defaultImageModel) ?? getFirstImageModel(models);
}
