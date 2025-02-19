'use client';

import { LlmModel } from '@/db/schema';
import React from 'react';
import { DEFAULT_CHAT_MODEL } from '@/app/api/chat/models';
import { saveChatModelAsCookie } from '@/app/(authed)/(dialog)/actions';

type LlmModelsProviderProps = {
  models: LlmModel[];
  defaultLlmModelByCookie: string;
  children: React.ReactNode;
};

type LlmModelsContextProps = {
  models: LlmModel[];
  selectedModel: LlmModel | undefined;
  setSelectedModel: (model: LlmModel) => void;
};

const LlmModelsContext = React.createContext<LlmModelsContextProps | undefined>(undefined);

export function LlmModelsProvider({
  models,
  children,
  defaultLlmModelByCookie,
}: LlmModelsProviderProps) {
  const selectedModel = getSelectedModel({ models, defaultLlmModelByCookie });

  function setSelectedModel(model: LlmModel) {
    void saveChatModelAsCookie(model.name);
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
  models: LlmModel[];
  defaultLlmModelByCookie: string | undefined;
}) {
  return (
    models.find((model) => model.name === defaultLlmModelByCookie) ??
    models.find((model) => model.name === DEFAULT_CHAT_MODEL) ??
    models[0]
  );
}
