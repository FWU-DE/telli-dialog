import { logError } from '@shared/logging';
import { SharedChatExpiredError, TelliPointsExceededError } from '@telli/ai-core/errors';
import { useTranslations } from 'next-intl';
import { useState, useCallback } from 'react';

export function useCheckStatusCode() {
  const t = useTranslations('common');

  const [error, setError] = useState<Error | undefined>(undefined);

  const handleError = useCallback((error: Error) => {
    if (TelliPointsExceededError.is(error)) {
      setError(new Error(t('rate-limit-error')));
    } else if (SharedChatExpiredError.is(error)) {
      setError(new Error(t('chat-expired')));
    } else {
      setError(new Error(t('generic-error')));
    }
    logError('Error in chat:', error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetError = () => {
    setError(undefined);
  };

  return {
    error,
    handleError,
    resetError,
  };
}
