'use client';

import { Switch } from '@ui/components/switch';
import { useTranslations } from 'next-intl';
import { Control, FieldPath, FieldValues, useController } from 'react-hook-form';
import { WebSearchScopeOptions } from './web-search-scope-options';
import { WebSearchIncludedDomains } from './web-search-included-domains';
import type { WebSearchScope } from '@shared/db/schema';
import type { WebSearchScopedFields, WebSearchToggleFields } from './web-search.types';

type BaseWebSearchEditViewProps = {
  onCheckedChange?: (checked: boolean) => void;
  onChange?: () => void;
};

export type WebSearchEditViewToggleProps<TFieldValues extends FieldValues = FieldValues> =
  BaseWebSearchEditViewProps & {
    showScopeOptions: false;
    control: Control<TFieldValues & WebSearchToggleFields>;
  };

export type WebSearchEditViewScopedProps<TFieldValues extends FieldValues = FieldValues> =
  BaseWebSearchEditViewProps & {
    showScopeOptions: true;
    control: Control<TFieldValues & WebSearchScopedFields>;
  };

export type WebSearchEditViewProps<TFieldValues extends FieldValues = FieldValues> =
  WebSearchEditViewToggleProps<TFieldValues> | WebSearchEditViewScopedProps<TFieldValues>;

function WebSearchScopeSection<TFieldValues extends FieldValues = FieldValues>({
  control,
  onChange,
}: {
  control: Control<TFieldValues & WebSearchScopedFields>;
  onChange?: () => void;
}) {
  const { field: scopeField } = useController({
    name: 'webSearchScope' as FieldPath<TFieldValues & WebSearchScopedFields>,
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

function WebSearchEditViewToggle<TFieldValues extends FieldValues = FieldValues>(
  props: WebSearchEditViewToggleProps<TFieldValues>,
) {
  const t = useTranslations('custom-chat.web-search');
  const { field, fieldState } = useController({
    name: 'isWebSearchEnabled' as FieldPath<TFieldValues & WebSearchToggleFields>,
    control: props.control,
  });

  return (
    <div className="flex flex-col gap-6">
      <Switch
        checked={field.value === true}
        onCheckedChange={(checked) => {
          field.onChange(checked);
          props.onCheckedChange?.(checked);
          props.onChange?.();
        }}
        aria-label={t('heading')}
        aria-invalid={fieldState.invalid}
      />
    </div>
  );
}

function WebSearchEditViewScoped<TFieldValues extends FieldValues = FieldValues>(
  props: WebSearchEditViewScopedProps<TFieldValues>,
) {
  const t = useTranslations('custom-chat.web-search');
  const { field, fieldState } = useController({
    name: 'isWebSearchEnabled' as FieldPath<TFieldValues & WebSearchScopedFields>,
    control: props.control,
  });

  return (
    <div className="flex flex-col gap-6">
      <Switch
        checked={field.value === true}
        onCheckedChange={(checked) => {
          field.onChange(checked);
          props.onCheckedChange?.(checked);
          props.onChange?.();
        }}
        aria-label={t('heading')}
        aria-invalid={fieldState.invalid}
      />
      {field.value === true && (
        <WebSearchScopeSection control={props.control} onChange={props.onChange} />
      )}
    </div>
  );
}

export function WebSearchEditView<TFieldValues extends FieldValues = FieldValues>(
  props: WebSearchEditViewProps<TFieldValues>,
) {
  if (props.showScopeOptions) {
    return <WebSearchEditViewScoped {...props} />;
  }

  return <WebSearchEditViewToggle {...props} />;
}
