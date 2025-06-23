import React from 'react';
import { useTranslations } from 'next-intl';
import ReloadIcon from '../icons/reload';

export function ErrorChatPlaceholder({
  error,
  handleReload,
}: {
  error?: Error;
  handleReload: () => void;
}) {
  const t = useTranslations('common');

  if (error === undefined) return undefined;

  return (
    <div className="p-4 gap-2 text-sm rounded-2xl bg-red-100 text-red-500 border border-red-500 text-right mt-8 max-w-3xl mx-auto">
      <div className="flex justify-between items-center px-2">
        <div className="text-left flex-1">
          <div>{error?.message}</div>
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
