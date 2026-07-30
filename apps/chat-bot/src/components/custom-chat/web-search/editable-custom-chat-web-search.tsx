'use client';

import { Switch } from '@ui/components/switch';
import { useTranslations } from 'next-intl';
import { FieldPath, FieldValues, useController } from 'react-hook-form';
import { CustomChatWebSearchScopeOptions } from './custom-chat-web-search-scope-options';
import type {
  EditableCustomChatWebSearchProps,
  WebSearchFields,
} from './custom-chat-web-search.types';

export function EditableCustomChatWebSearch<TFieldValues extends FieldValues = FieldValues>(
  props: EditableCustomChatWebSearchProps<TFieldValues>,
) {
  const t = useTranslations('custom-chat.web-search');
  const { field, fieldState } = useController({
    name: 'isWebSearchEnabled' as FieldPath<TFieldValues & WebSearchFields>,
    control: props.control,
  });

  return (
    <div className="flex flex-col gap-6">
      <Switch
        checked={field.value}
        onCheckedChange={(checked) => {
          field.onChange(checked);
          props.onCheckedChange?.(checked);
          props.onChange?.();
        }}
        aria-label={t('heading')}
        aria-invalid={fieldState.invalid}
      />
      {props.showScopeOptions === true && field.value === true ? (
        <CustomChatWebSearchScopeOptions control={props.control} onChange={props.onChange} />
      ) : null}
    </div>
  );
}
