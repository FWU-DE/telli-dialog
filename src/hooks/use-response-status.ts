import { useTranslations } from 'next-intl';
import { useState, useCallback } from 'react';

export function useRateLimitAware() {
  const t = useTranslations('common');
  const [rateLimitReached, setRateLimitReached] = useState(false);

  const [error, setError] = useState<Error | null>(null);
  const handleResponse = useCallback((response: Response) => {
    if (response.status === 429) {
      setError(new Error(t('rate-limit-error')));
    } else if (response.status !== 200) {
      setError(new Error(t('generic-error')));
    } else {
      setError(null);
    }
  }, []);

  const clearRateLimit = useCallback(() => {
    setRateLimitReached(false);
  }, []);

  return {
    error,
    handleResponse,
    clearRateLimit,
  };
}
