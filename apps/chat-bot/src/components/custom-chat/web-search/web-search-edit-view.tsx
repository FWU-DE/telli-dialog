'use client';

import { Switch } from '@ui/components/switch';
import { useTranslations } from 'next-intl';
import { Control, FieldPath, FieldValues, useController } from 'react-hook-form';
import { WebSearchScopeOptions } from './web-search-scope-options';
import { WebSearchIncludedDomains } from './web-search-included-domains';
import type { WebSearchScope } from '@shared/db/schema';
import type { WebSearchFields } from './web-search.types';

type WebSearchBaseFields = Pick<WebSearchFields, 'isWebSearchEnabled'>;
type WebSearchScopeFields = Pick<
  WebSearchFields,
  'isWebSearchEnabled' | 'webSearchScope' | 'webSearchIncludedDomains'
>;

type WebSearchEditViewWithoutScopeProps<TFieldValues extends FieldValues = FieldValues> = {
  readonly?: false;
  control: Control<TFieldValues & WebSearchBaseFields>;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: () => void;
  showScopeOptions?: false;
};

type WebSearchEditViewWithScopeProps<TFieldValues extends FieldValues = FieldValues> = {
  readonly?: false;
  control: Control<TFieldValues & WebSearchScopeFields>;
  onCheckedChange?: (checked: boolean) => void;
  onChange?: () => void;
  showScopeOptions: true;
};

type WebSearchEditViewProps<TFieldValues extends FieldValues = FieldValues> =
  WebSearchEditViewWithoutScopeProps<TFieldValues> | WebSearchEditViewWithScopeProps<TFieldValues>;

function WebSearchScopeSection<TFieldValues extends FieldValues = FieldValues>({
  control,
  onChange,
}: {
  control: Control<TFieldValues & WebSearchScopeFields>;
  onChange?: () => void;
}) {
  const { field: scopeField } = useController({
    name: 'webSearchScope' as FieldPath<TFieldValues & WebSearchScopeFields>,
    control,
  });
  const scopeValue = (scopeField.value as WebSearchScope) ?? 'all-web';

  return (
    <>
      <WebSearchScopeOptions
        scopeValue={scopeValue}
        onScopeChange={(value) => {
          scopeField.onChange(value);
          onChange?.();
        }}
      />
      {scopeValue === 'included-domains' && (
        <WebSearchIncludedDomains control={control} onChange={onChange} />
      )}
    </>
  );
}

export function WebSearchEditView<TFieldValues extends FieldValues = FieldValues>(
  props: WebSearchEditViewProps<TFieldValues>,
) {
  const t = useTranslations('custom-chat.web-search');
  const { field, fieldState } = useController({
    name: 'isWebSearchEnabled' as FieldPath<TFieldValues & WebSearchBaseFields>,
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
        <WebSearchScopeSection control={props.control} onChange={props.onChange} />
      ) : null}
    </div>
  );
}
