import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/select';
import { Field, FieldLabel } from '@ui/components/field';
import { useTranslations } from 'next-intl';

type TimeLimitSelectProps = {
  defaultValue: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  usageTimeValuesInMinutes: number[];
  isAdditionalTime?: boolean;
};

export function TimeLimitSelect({
  defaultValue,
  onChange,
  disabled,
  usageTimeValuesInMinutes,
  isAdditionalTime = false,
}: TimeLimitSelectProps) {
  const t = useTranslations('custom-chat.share-with-learners');

  return (
    <div className="whitespace-nowrap flex-1">
      <Field>
        <FieldLabel>{isAdditionalTime ? t('additional-time') : t('max-usage')}</FieldLabel>
        <Select
          defaultValue={defaultValue}
          onValueChange={(value) => onChange(Number(value))}
          disabled={disabled}
        >
          <SelectTrigger
            aria-label={isAdditionalTime ? t('additional-time') : t('max-usage')}
            data-testid="usage-time-select"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {usageTimeValuesInMinutes.map((value) => {
                let displayLabel = `${isAdditionalTime ? '+ ' : ''}${value} ${t('minutes')}`;
                if (value >= 24 * 60) {
                  const days = value / (24 * 60);
                  displayLabel =
                    days === 1
                      ? `${isAdditionalTime ? '+ ' : ''}1 ${t('day')}`
                      : `${isAdditionalTime ? '+ ' : ''}${days} ${t('days')}`;
                }
                return (
                  <SelectItem
                    key={value}
                    value={String(value)}
                    data-testid={`usage-time-option-${value}`}
                  >
                    {displayLabel}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
