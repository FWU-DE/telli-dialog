'use client';

import React from 'react';
import { useLlmModels } from '../providers/llm-model-provider';
import ModelSelect from '../common/model-select';

type SelectLlmModelProps = {
  isStudent?: boolean;
};

export default function SelectLlmModel({ isStudent = false }: SelectLlmModelProps) {
  const { models, selectedModel, setSelectedModel } = useLlmModels();

  return (
    <ModelSelect
      models={models}
      selectedModel={selectedModel}
      onModelChange={setSelectedModel}
      modelType="text"
      label="Aktuelles Sprachmodell"
      noModelsLabel="Kein Sprachmodell verfügbar"
      isStudent={isStudent}
      enableUrlParams={true}
    />
  );
}
