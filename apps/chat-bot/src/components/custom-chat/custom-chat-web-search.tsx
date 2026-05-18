'use client';

import { Switch } from '@ui/components/switch';
import { useTranslations } from 'next-intl';
import { CustomChatHeading2 } from './custom-chat-heading2';
import { Card, CardContent } from '@ui/components/card';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { CheckCircleIcon } from '@phosphor-icons/react';

type CustomChatWebSearchProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> =
  | {
      readonly: true;
      name?: never;
      control?: never;
      onCheckedChange?: never;
    }
  | {
      readonly?: false;
      name: TName;
      control: Control<TFieldValues>;
      onCheckedChange?: (checked: boolean) => void;
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
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={(checked) => {
                    field.onChange(checked);
                    props.onCheckedChange?.(checked);
                  }}
                  aria-label={t('heading')}
                />
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
