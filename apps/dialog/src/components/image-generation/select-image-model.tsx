'use client';

import React from 'react';
import { useImageModels } from '../providers/image-model-provider';
import ModelSelect from '../common/model-select';

export default function SelectImageModel() {
  const { models, selectedModel, setSelectedModel } = useImageModels();

  return (
    <ModelSelect
      models={models}
      selectedModel={selectedModel}
      onModelChange={setSelectedModel}
      modelType="image"
      label="Bildgenerierungs-Modell"
      noModelsLabel="Kein Modell verfügbar"
      isStudent={false}
      enableUrlParams={false}
    />
  );
}
