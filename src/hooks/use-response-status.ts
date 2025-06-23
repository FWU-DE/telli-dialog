import { useTranslations } from 'next-intl';
import { useState, useCallback } from 'react';

export function useRateLimitAware() {
  const t = useTranslations('common');

  const [error, setError] = useState<{ message: string; name?: string } | undefined>(undefined);
  
  const handleResponse = useCallback((response: Response) => {
    if (response.status === 429) {
      setError({ message: t('rate-limit-title') });
    } else if (response.status === 400) {
      console.log('chat expired');
      setError({ message: t('chat-expired')});
    } else if (response.status !== 200) {
      setError({ message: t('generic-error') });
    } else {
      setError(undefined);
    }
  }, []);

  const clearRateLimit = useCallback(() => {
    setError(undefined);
  }, []);

  return {
    error,
    handleResponse,
    clearRateLimit,
  };
}
