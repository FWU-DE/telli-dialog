'use client';

import { useTranslations } from 'next-intl';
import { CustomChatHeading2 } from '../custom-chat-heading2';
import { Card, CardContent } from '@ui/components/card';
import { FieldValues } from 'react-hook-form';
import { WebSearchEditView } from './web-search-edit-view';
import { WebSearchReadonlyView } from './web-search-readonly-view';
import type { WebSearchProps } from './web-search.types';

export function CustomChatWebSearch<TFieldValues extends FieldValues = FieldValues>(
  props: WebSearchProps<TFieldValues>,
) {
  const t = useTranslations('custom-chat.web-search');

  return (
    <div className="flex flex-col gap-3 mt-10">
      <CustomChatHeading2 text={t('heading')} tooltip={t('heading-tooltip')} />
      <Card>
        <CardContent>
          {props.readonly ? <WebSearchReadonlyView /> : <WebSearchEditView {...props} />}
        </CardContent>
      </Card>
    </div>
  );
}
