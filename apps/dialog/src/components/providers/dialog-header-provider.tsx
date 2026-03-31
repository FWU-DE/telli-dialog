'use client';

import React from 'react';

export type DialogHeaderDocumentStatus = {
  isDirty?: boolean;
  isSaving?: boolean;
  lastSavedAt?: Date | null;
  errorMessage?: string | null;
};

type DialogHeaderContextProps = {
  content: React.ReactNode | null;
  documentStatus: DialogHeaderDocumentStatus | null;
  setHeaderContent: (content: React.ReactNode | null) => void;
  setDocumentStatus: (status: DialogHeaderDocumentStatus | null) => void;
  clearHeader: () => void;
};

const DialogHeaderContext = React.createContext<DialogHeaderContextProps | undefined>(undefined);

export function DialogHeaderProvider({ children }: { children: React.ReactNode }) {
  const [content, setHeaderContent] = React.useState<React.ReactNode | null>(null);
  const [documentStatus, setDocumentStatus] = React.useState<DialogHeaderDocumentStatus | null>(
    null,
  );

  const clearHeader = React.useCallback(() => {
    setHeaderContent(null);
    setDocumentStatus(null);
  }, []);

  return (
    <DialogHeaderContext.Provider
      value={{
        content,
        documentStatus,
        setHeaderContent,
        setDocumentStatus,
        clearHeader,
      }}
    >
      {children}
    </DialogHeaderContext.Provider>
  );
}

export function useDialogHeader(): DialogHeaderContextProps {
  const maybeContext = React.useContext(DialogHeaderContext);

  if (maybeContext === undefined) {
    throw Error('useDialogHeader can only be used inside a DialogHeaderProvider');
  }

  return maybeContext;
}

export function useRegisterDialogHeader(content: React.ReactNode | null) {
  const { setHeaderContent, clearHeader } = useDialogHeader();

  React.useEffect(() => {
    setHeaderContent(content);
  }, [content, setHeaderContent]);

  React.useEffect(() => {
    return () => {
      clearHeader();
    };
  }, [clearHeader]);
}

export function useDialogHeaderDocumentStatus(status: DialogHeaderDocumentStatus | null) {
  const { setDocumentStatus } = useDialogHeader();

  React.useEffect(() => {
    setDocumentStatus(status);
  }, [setDocumentStatus, status]);

  React.useEffect(() => {
    return () => {
      setDocumentStatus(null);
    };
  }, [setDocumentStatus]);
}
