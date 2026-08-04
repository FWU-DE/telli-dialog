'use client';

import { useTranslations } from 'next-intl';
import { CustomChatHeading2 } from '../custom-chat-heading2';
import { Card, CardContent } from '@ui/components/card';
import { Control, FieldValues } from 'react-hook-form';
import { WebSearchEditView } from './web-search-edit-view';
import { WebSearchReadonlyView } from './web-search-readonly-view';
import type { WebSearchFields } from './web-search.types';

/** This type is for assistants that do not have webSearchScope and webSearchIncludedDomains */
type WebSearchBaseFields = Pick<WebSearchFields, 'isWebSearchEnabled'>;
/** This type is for characters and learningScenarios */
type WebSearchScopeFields = Pick<
  WebSearchFields,
  'isWebSearchEnabled' | 'webSearchScope' | 'webSearchIncludedDomains'
>;

type WebSearchProps<TFieldValues extends FieldValues = FieldValues> =
  | {
      readonly: true;
    }
  | {
      readonly?: false;
      control: Control<TFieldValues & WebSearchBaseFields>;
      onCheckedChange?: (checked: boolean) => void;
      onChange?: () => void;
      showScopeOptions?: false;
    }
  | {
      readonly?: false;
      control: Control<TFieldValues & WebSearchScopeFields>;
      onCheckedChange?: (checked: boolean) => void;
      onChange?: () => void;
      showScopeOptions: true;
    };

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
