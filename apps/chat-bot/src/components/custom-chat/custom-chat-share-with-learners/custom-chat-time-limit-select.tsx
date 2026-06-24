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
                let displayLabel = `${isAdditionalTime ? '+ ' : ''}${t('minutes-count', {
                  count: value,
                })}`;
                if (value >= 24 * 60) {
                  const days = value / (24 * 60);
                  displayLabel = `${isAdditionalTime ? '+ ' : ''}${t('days-count', {
                    count: days,
                  })}`;
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
