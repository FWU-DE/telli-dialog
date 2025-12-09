'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useLlmModels } from '../providers/llm-model-provider';
import ModelSelect from '../common/model-select';

type SelectLlmModelProps = {
  isStudent?: boolean;
};

export default function SelectLlmModel({ isStudent = false }: SelectLlmModelProps) {
  const { models, selectedModel, setSelectedModel } = useLlmModels();
  const t = useTranslations('common');

  return (
    <ModelSelect
      models={models}
      selectedModel={selectedModel}
      onModelChange={setSelectedModel}
      modelType="text"
      label={t('current-language-model')}
      noModelsLabel={t('no-language-model-available')}
      isStudent={isStudent}
      enableUrlParams={true}
    />
  );
}
