'use client';

import React from 'react';
import { FederalStateModel } from '@shared/types/federal-state';

const FederalStateContext = React.createContext<FederalStateModel | undefined>(undefined);

export function useFederalState(): FederalStateModel | undefined {
  return React.useContext(FederalStateContext);
}

export function FederalStateProvider({
  children,
  federalState,
}: {
  children: React.ReactNode;
  federalState: FederalStateModel;
}) {
  return <FederalStateContext value={federalState}>{children}</FederalStateContext>;
}
