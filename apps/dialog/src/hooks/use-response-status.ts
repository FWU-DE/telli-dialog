import { useTranslations } from 'next-intl';
import { useState, useCallback } from 'react';

export function useCheckStatusCode() {
  const t = useTranslations('common');

  const [error, setError] = useState<Error | undefined>(undefined);

  const handleResponse = useCallback((response: Response) => {
    if (response.status === 200) {
      resetError();
      return;
    }
    if (response.status === 429) {
      setError(new Error(`${t('rate-limit-title')}: ${t('rate-limit-error')}`));
    } else if (response.status === 400) {
      setError(new Error(t('chat-expired')));
    } else {
      setError(new Error(t('generic-error')));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetError = () => {
    setError(undefined);
  };

  return {
    error,
    handleResponse,
    resetError,
  };
}
