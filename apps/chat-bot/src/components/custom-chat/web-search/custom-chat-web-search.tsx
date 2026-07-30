'use client';

import { useTranslations } from 'next-intl';
import { CustomChatHeading2 } from '../custom-chat-heading2';
import { Card, CardContent } from '@ui/components/card';
import { FieldValues } from 'react-hook-form';
import { CheckCircleIcon } from '@phosphor-icons/react';
import { EditableCustomChatWebSearch } from './editable-custom-chat-web-search';
import type { CustomChatWebSearchProps } from './custom-chat-web-search.types';

export function CustomChatWebSearch<TFieldValues extends FieldValues = FieldValues>(
  props: CustomChatWebSearchProps<TFieldValues>,
) {
  const t = useTranslations('custom-chat.web-search');

  return (
    <div className="flex flex-col gap-3 mt-10">
      <CustomChatHeading2 text={t('heading')} tooltip={t('heading-tooltip')} />
      <Card>
        <CardContent>
          {props.readonly ? (
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="size-6.5 shrink-0 text-success" />
              <span>{t('activated')}</span>
            </div>
          ) : (
            <EditableCustomChatWebSearch {...props} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
