'use client';

import { useTranslations } from 'next-intl';
import { Control, FieldPath, FieldValues, useController } from 'react-hook-form';
import { RadioGroup, RadioGroupItem } from '@ui/components/radio-group';
import { FieldLabel } from '@ui/components/field';
import type { WebSearchScope } from '@shared/db/schema';
import { WebSearchIncludedDomains } from './web-search-included-domains';
import type { WebSearchFields } from './web-search.types';

export function WebSearchScopeOptions<TFieldValues extends FieldValues>({
  control,
  onChange,
}: {
  control: Control<TFieldValues & WebSearchFields>;
  onChange?: () => void;
}) {
  const t = useTranslations('custom-chat.web-search');
  const { field: scopeField } = useController({
    name: 'webSearchScope' as FieldPath<TFieldValues & WebSearchFields>,
    control,
  });
  const scopeValue = (scopeField.value as WebSearchScope) ?? 'all-web';
  const allWebId = `${scopeField.name}-all-web`;
  const includedDomainsId = `${scopeField.name}-included-domains`;

  return (
    <>
      <RadioGroup
        value={scopeValue}
        onValueChange={(value) => {
          scopeField.onChange(value as WebSearchScope);
          onChange?.();
        }}
        aria-label={t('scope-aria-label')}
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="all-web" id={allWebId} />
          <FieldLabel htmlFor={allWebId} size="normal">
            {t('scope-all-web')}
          </FieldLabel>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="included-domains" id={includedDomainsId} />
          <FieldLabel htmlFor={includedDomainsId} size="normal">
            {t('scope-included-domains')}
          </FieldLabel>
        </div>
      </RadioGroup>
      {scopeValue === 'included-domains' && (
        <WebSearchIncludedDomains control={control} onChange={onChange} />
      )}
    </>
  );
}
