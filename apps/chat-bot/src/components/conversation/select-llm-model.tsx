'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLlmModels } from '../providers/llm-model-provider';
import { useFederalState } from '../providers/federal-state-provider';
import { getFilteredTextModels } from '@shared/llm-models/llm-model-service';
import ModelSelect from '../common/model-select';
import ModelMatrix from '../common/model-matrix';

type SelectLlmModelProps = {
  isStudent?: boolean;
};

function useIsDesktop(breakpoint = 768) {
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== 'undefined' && window.matchMedia(`(min-width: ${breakpoint}px)`).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${breakpoint}px)`);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return isDesktop;
}

export default function SelectLlmModel({ isStudent = false }: SelectLlmModelProps) {
  const { models, selectedModel, setSelectedModel } = useLlmModels();
  const federalState = useFederalState();
  const t = useTranslations('common');
  const isDesktop = useIsDesktop();

  const filteredModels = getFilteredTextModels(models);
  const isMatrixEnabled = federalState?.featureToggles?.isModelMatrixEnabled ?? false;

  const sharedProps = {
    models: filteredModels,
    selectedModel,
    onModelChange: setSelectedModel,
    label: t('current-language-model'),
    noModelsLabel: t('no-language-model-available'),
    isStudent,
    enableUrlParams: true,
  };

  if (isMatrixEnabled && isDesktop) {
    return <ModelMatrix {...sharedProps} />;
  }

  return <ModelSelect {...sharedProps} modelType="text" />;
}
