'use client';

import { LlmModelWithStaticRoles } from '@shared/db/schema';
import React, { useState } from 'react';
import { getDefaultModel } from '@shared/llm-models/llm-model-service';

type LlmModelsProviderProps = {
  models: LlmModelWithStaticRoles[];
  defaultLlmModelByCookie: string;
  initialDownloadConversationEnabled?: boolean;
  children: React.ReactNode;
};

type LlmModelsContextProps = {
  models: LlmModelWithStaticRoles[];
  selectedModel: LlmModelWithStaticRoles | undefined;
  setSelectedModel: (model: LlmModelWithStaticRoles) => Promise<void>;
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
  const [selectedModel, setSelectedModelState] = useState<LlmModelWithStaticRoles | undefined>(() =>
    getSelectedModel({ models, defaultLlmModelByCookie }),
  );
  const [downloadConversationEnabled, setDownloadConversationEnabled] = useState(
    initialDownloadConversationEnabled,
  );

  async function setSelectedModel(model: LlmModelWithStaticRoles) {
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
    throw new Error('useLlmModels can only be used inside a LlmModelsProvider');
  }
  return maybeContext;
}

function getSelectedModel({
  models,
  defaultLlmModelByCookie,
}: {
  models: LlmModelWithStaticRoles[];
  defaultLlmModelByCookie: string | undefined;
}) {
  return models.find((model) => model.name === defaultLlmModelByCookie) ?? getDefaultModel(models);
}
