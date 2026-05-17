'use client';

import { Card, CardContent } from '@ui/components/card';
import { CustomChatHeading2 } from './custom-chat-heading2';
import { useTranslations } from 'next-intl';
import { CheckCircleIcon } from '@phosphor-icons/react';

export function CustomChatWebSearchReadonly() {
  const t = useTranslations('custom-chat.web-search');

  return (
    <div className="flex flex-col gap-3 mt-10">
      <CustomChatHeading2 text={t('heading')} tooltip={t('heading-tooltip')} />
      <Card>
        <CardContent>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="size-6.5 shrink-0 text-success" />
            <span>{t('activated')}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
