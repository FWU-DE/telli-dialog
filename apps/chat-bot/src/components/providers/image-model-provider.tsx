'use client';

import { LlmModelWithStaticRoles } from '@shared/db/schema';
import React from 'react';

type ImageModelsProviderProps = {
  models: LlmModelWithStaticRoles[];
  defaultImageModel: LlmModelWithStaticRoles | undefined;
  children: React.ReactNode;
};

type ImageModelsContextProps = {
  models: LlmModelWithStaticRoles[];
  selectedModel: LlmModelWithStaticRoles | undefined;
  setSelectedModel: (model: LlmModelWithStaticRoles) => void;
};

const ImageModelsContext = React.createContext<ImageModelsContextProps | undefined>(undefined);

function getFirstImageModel(
  models: LlmModelWithStaticRoles[],
): LlmModelWithStaticRoles | undefined {
  return models.find((model) => model.priceMetadata.type === 'image');
}

export function ImageModelsProvider({
  models,
  children,
  defaultImageModel,
}: ImageModelsProviderProps) {
  const [selectedModel, setSelectedModel] = React.useState<LlmModelWithStaticRoles | undefined>(
    defaultImageModel ?? getFirstImageModel(models),
  );

  return (
    <ImageModelsContext.Provider value={{ models, selectedModel, setSelectedModel }}>
      {children}
    </ImageModelsContext.Provider>
  );
}

export function useImageModels(): ImageModelsContextProps {
  const maybeContext = React.useContext(ImageModelsContext);

  if (maybeContext === undefined) {
    throw new Error('useImageModels can only be used inside a ImageModelsProvider');
  }
  return maybeContext;
}
