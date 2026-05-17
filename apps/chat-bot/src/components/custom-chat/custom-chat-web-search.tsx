'use client';

import { Switch } from '@ui/components/Switch';
import { useTranslations } from 'next-intl';
import { CustomChatHeading2 } from './custom-chat-heading2';
import { Card, CardContent } from '@ui/components/Card';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

type CustomChatWebSearchProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  control: Control<TFieldValues>;
  onCheckedChange?: (checked: boolean) => void;
};

export function CustomChatWebSearch<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, control, onCheckedChange }: CustomChatWebSearchProps<TFieldValues, TName>) {
  const t = useTranslations('custom-chat.web-search');

  return (
    <div className="flex flex-col gap-3 mt-10">
      <CustomChatHeading2 text={t('heading')} tooltip={t('heading-tooltip')} />
      <Card>
        <CardContent>
          <Controller
            name={name}
            control={control}
            render={({ field }) => (
              <Switch
                id="web-search-toggle"
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  onCheckedChange?.(checked);
                }}
                aria-label={t('heading')}
              />
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
