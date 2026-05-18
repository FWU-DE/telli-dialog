'use client';

import { ConversationModel } from '@shared/db/types';
import React from 'react';

type ConversationProviderProps = {
  conversation: ConversationModel;
  children: React.ReactNode;
};

const ConversationContext = React.createContext<ConversationModel | undefined>(undefined);

export function ConversationProvider({ conversation, children }: ConversationProviderProps) {
  return (
    <ConversationContext.Provider value={conversation}>{children}</ConversationContext.Provider>
  );
}

export function useConversation(): ConversationModel | undefined {
  return React.useContext(ConversationContext);
}
