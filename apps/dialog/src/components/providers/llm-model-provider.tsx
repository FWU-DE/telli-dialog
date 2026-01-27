'use client';

import { LlmModelSelectModel } from '@shared/db/schema';
import React from 'react';
import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';
import { saveChatModelForUserAction } from '@/app/(authed)/(dialog)/actions';
import { getFirstTextModel } from '@shared/llm-models/llm-model-service';

type LlmModelsProviderProps = {
  models: LlmModelSelectModel[];
  defaultLlmModelByCookie: string;
  children: React.ReactNode;
};

type LlmModelsContextProps = {
  models: LlmModelSelectModel[];
  selectedModel: LlmModelSelectModel | undefined;
  setSelectedModel: (model: LlmModelSelectModel) => Promise<void>;
};

const LlmModelsContext = React.createContext<LlmModelsContextProps | undefined>(undefined);

export function LlmModelsProvider({
  models,
  children,
  defaultLlmModelByCookie,
}: LlmModelsProviderProps) {
  const selectedModel = getSelectedModel({ models, defaultLlmModelByCookie });

  async function setSelectedModel(model: LlmModelSelectModel) {
    await saveChatModelForUserAction(model.name);
  }

  return (
    <LlmModelsContext.Provider value={{ models, selectedModel, setSelectedModel }}>
      {children}
    </LlmModelsContext.Provider>
  );
}

export function useLlmModels(): LlmModelsContextProps {
  const maybeContext = React.useContext(LlmModelsContext);

  if (maybeContext === undefined) {
    throw Error('useLlmModels can only be used inside a LlmModelsProvider');
  }
  return maybeContext;
}

function getSelectedModel({
  models,
  defaultLlmModelByCookie,
}: {
  models: LlmModelSelectModel[];
  defaultLlmModelByCookie: string | undefined;
}) {
  return (
    models.find((model) => model.name === defaultLlmModelByCookie) ??
    models.find((model) => model.name === DEFAULT_CHAT_MODEL) ??
    getFirstTextModel(models)
  );
}
