'use client';

import { LlmModelSelectModel } from '@shared/db/schema';
import React, { useState } from 'react';
import { DEFAULT_CHAT_MODEL } from '@shared/llm-models/default-llm-models';
import { getFirstTextModel } from '@shared/llm-models/llm-model-service';

type LlmModelsProviderProps = {
  models: LlmModelSelectModel[];
  defaultLlmModelByCookie: string;
  initialDownloadConversationEnabled?: boolean;
  children: React.ReactNode;
};

type LlmModelsContextProps = {
  models: LlmModelSelectModel[];
  selectedModel: LlmModelSelectModel | undefined;
  setSelectedModel: (model: LlmModelSelectModel) => Promise<void>;
  downloadConversationEnabled: boolean;
  setDownloadConversationEnabled: (value: boolean) => void;
};

const LlmModelsContext = React.createContext<LlmModelsContextProps | undefined>(undefined);

export function LlmModelsProvider({
  models,
  children,
  defaultLlmModelByCookie,
  initialDownloadConversationEnabled = false,
}: LlmModelsProviderProps) {
  const [selectedModel, setSelectedModelState] = useState<LlmModelSelectModel | undefined>(() =>
    getSelectedModel({ models, defaultLlmModelByCookie }),
  );
  const [downloadConversationEnabled, setDownloadConversationEnabled] = useState(
    initialDownloadConversationEnabled,
  );

  async function setSelectedModel(model: LlmModelSelectModel) {
    // optimistically update selected model
    const previousModel = selectedModel;
    setSelectedModelState(model);
    try {
      // Use a route handler instead of a Server Action to avoid Next.js automatically
      // refreshing the router cache (which happens when a Server Action writes cookies).
      const response = await fetch('/api/user/model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName: model.name }),
      });

      if (!response.ok) {
        setSelectedModelState(previousModel);
      }
    } catch {
      setSelectedModelState(previousModel);
    }
  }

  return (
    <LlmModelsContext.Provider
      value={{
        models,
        selectedModel,
        setSelectedModel,
        downloadConversationEnabled,
        setDownloadConversationEnabled,
      }}
    >
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
