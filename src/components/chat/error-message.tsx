import React from 'react';
import { useTranslations } from 'next-intl';
import ReloadIcon from '../icons/reload';

export function ErrorChatPlaceholder({
  error,
  handleReload,
  isRateLimitError,
}: {
  error?: Error;
  isRateLimitError?: boolean;
  handleReload: () => void;
}) {
  const t = useTranslations('common');

  if (error === undefined) return undefined;
  console.log('isRateLimitError', isRateLimitError);
  const getErrorMessage = () => {
    if (isRateLimitError) {
      return t('rate-limit-error');
    }
    return error.message || t('generic-error');
  };

  const getErrorTitle = () => {
    if (isRateLimitError) {
      return t('rate-limit-title');
    }
    return null;
  };

  const errorTitle = getErrorTitle();

  return (
    <div className="p-4 gap-2 text-sm rounded-2xl bg-red-100 text-red-500 border border-red-500 text-right mt-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center px-2">
        <div className="text-left flex-1">
          {errorTitle && (
            <div className="font-semibold mb-1">{errorTitle}</div>
          )}
          <div>{getErrorMessage()}</div>
        </div>
        <button
          onClick={() => handleReload()}
          type="button"
          className="hover:bg-red-200 p-2 rounded-lg"
          aria-label={t('retry-button')}
        >
          <ReloadIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
