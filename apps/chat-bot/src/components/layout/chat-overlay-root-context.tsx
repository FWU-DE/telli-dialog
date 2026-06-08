'use client';

import React from 'react';

export const ChatOverlayRootContext = React.createContext<HTMLElement | null>(null);

export function useChatOverlayRoot() {
  return React.useContext(ChatOverlayRootContext);
}
