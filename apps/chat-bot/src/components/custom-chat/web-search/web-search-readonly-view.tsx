'use client';

import { useTranslations } from 'next-intl';
import { CheckCircleIcon } from '@phosphor-icons/react';

export function WebSearchReadonlyView() {
  const t = useTranslations('custom-chat.web-search');

  return (
    <div className="flex items-center gap-2">
      <CheckCircleIcon className="size-6.5 shrink-0 text-success" />
      <span>{t('activated')}</span>
    </div>
  );
}
