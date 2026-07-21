'use client';

import CollapseSidebar from '@/components/common/collapse-sidebar';
import { WarningIcon } from '@phosphor-icons/react';
import { useTranslations } from 'next-intl';

export default function SharedChatNotFound() {
  const t = useTranslations('common');

  return (
    <>
      <CollapseSidebar />
      <div className="flex justify-center">
        <div className="p-6 flex flex-col gap-4 items-center rounded-xl border bg-light-gray max-w-fit">
          <WarningIcon className="size-12 text-primary" aria-hidden="true" />
          <span>{t('not-found-error')}</span>
        </div>
      </div>
    </>
  );
}
