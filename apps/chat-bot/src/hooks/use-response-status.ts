import { logError } from '@shared/logging';
import { SharedChatExpiredError, TokenPointsExceededError } from '@ais-chat/ai-core/errors';
import { useTranslations } from 'next-intl';
import { useState, useCallback } from 'react';

export function useCheckStatusCode() {
  const t = useTranslations('common');

  const [error, setError] = useState<Error | undefined>(undefined);
  const [isChatExpired, setIsChatExpired] = useState(false);

  const handleError = useCallback((error: Error) => {
    const errorName = (error as { name?: string }).name;

    if (TokenPointsExceededError.is(error)) {
      setError(new Error(t('rate-limit-error')));
    } else if (SharedChatExpiredError.is(error)) {
      setIsChatExpired(true);
      setError(new Error(t('chat-expired')));
    } else if (errorName === 'NotFoundError') {
      setError(new Error(t('not-found-error')));
    } else {
      setError(new Error(t('generic-error')));
    }
    logError('Error in chat:', error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetError = () => {
    setError(undefined);
    setIsChatExpired(false);
  };

  return {
    error,
    isChatExpired,
    handleError,
    resetError,
  };
}
