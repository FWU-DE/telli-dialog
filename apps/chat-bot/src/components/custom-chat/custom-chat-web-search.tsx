'use client';

import { Switch } from '@ui/components/switch';
import { useTranslations } from 'next-intl';
import { CustomChatHeading2 } from './custom-chat-heading2';
import { CustomChatWebSearchIncludedDomains } from './custom-chat-web-search-included-domains';
import { Card, CardContent } from '@ui/components/card';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { CheckCircleIcon } from '@phosphor-icons/react';
import { RadioGroup, RadioGroupItem } from '@ui/components/radio-group';
import { FieldLabel } from '@ui/components/field';
import type { WebSearchScope } from '@shared/db/schema';

type CustomChatWebSearchProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> =
  | {
      readonly: true;
      name?: never;
      control?: never;
      onCheckedChange?: never;
      onChange?: never;
      showScopeOptions?: never;
      scopeName?: never;
      includedDomainsName?: never;
    }
  | {
      readonly?: false;
      name: TName;
      control: Control<TFieldValues>;
      onCheckedChange?: (checked: boolean) => void;
      onChange?: () => void;
      showScopeOptions?: false;
      scopeName?: never;
      includedDomainsName?: never;
    }
  | {
      readonly?: false;
      name: TName;
      control: Control<TFieldValues>;
      onCheckedChange?: (checked: boolean) => void;
      onChange?: () => void;
      showScopeOptions: true;
      scopeName: FieldPath<TFieldValues>;
      includedDomainsName: FieldPath<TFieldValues>;
    };

export function CustomChatWebSearch<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: CustomChatWebSearchProps<TFieldValues, TName>) {
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
            <Controller
              name={props.name}
              control={props.control}
              render={({ field, fieldState }) => (
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
                    <>
                      <Controller
                        name={props.scopeName}
                        control={props.control}
                        render={({ field: scopeField }) => {
                          const scopeValue = (scopeField.value as WebSearchScope) ?? 'all-web';
                          const allWebId = `${scopeField.name}-all-web`;
                          const includedDomainsId = `${scopeField.name}-included-domains`;
                          return (
                            <>
                              <RadioGroup
                                value={scopeValue}
                                onValueChange={(value) => {
                                  scopeField.onChange(value as WebSearchScope);
                                  props.onChange?.();
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
                                <>
                                  <CustomChatWebSearchIncludedDomains
                                    control={props.control}
                                    name={props.includedDomainsName}
                                    onChange={props.onChange}
                                  />
                                </>
                              )}
                            </>
                          );
                        }}
                      />
                    </>
                  ) : null}
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
