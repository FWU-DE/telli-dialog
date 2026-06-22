import { Field, FieldLabel } from '@ui/components/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components/select';
import { useTranslations } from 'next-intl';
import {
  DefaultTokenPointsPercentageLimit,
  MaxTokenPointsPercentageLimit,
} from './custom-chat-share-with-learners-limit-params';

type GetSelectableTokenPointsPercentageValuesInput = {
  pointsPercentageValues: number[];
  maxAvailablePercentage: number;
  lowerBoundary?: number;
};

export function getSelectableTokenPointsPercentageValues({
  pointsPercentageValues,
  maxAvailablePercentage,
  lowerBoundary = 0,
}: GetSelectableTokenPointsPercentageValuesInput): number[] {
  return pointsPercentageValues.filter(
    (value) => value >= lowerBoundary && value < maxAvailablePercentage,
  );
}

type GetMaxAvailablePercentageInput = {
  usedBudget: number;
  maxBudget: number;
};

export function getMaxAvailablePercentage({
  usedBudget,
  maxBudget,
}: GetMaxAvailablePercentageInput): number {
  const rawMaxAvailablePercentage =
    Number.isFinite(maxBudget) && maxBudget > 0 ? 100 - (usedBudget / maxBudget) * 100 : 0;

  return Math.min(Math.max(rawMaxAvailablePercentage, 0), 100);
}

type ResolveTokenPointsPercentageLimitInput = {
  previousTokenPointsLimit: number | null;
  selectableFixedValues: number[];
  defaultTokenPointsPercentageLimit?: number;
};

export function resolveTokenPointsPercentageLimit({
  previousTokenPointsLimit,
  selectableFixedValues,
  defaultTokenPointsPercentageLimit = DefaultTokenPointsPercentageLimit,
}: ResolveTokenPointsPercentageLimitInput): number {
  if (previousTokenPointsLimit === MaxTokenPointsPercentageLimit) {
    return MaxTokenPointsPercentageLimit;
  }

  if (previousTokenPointsLimit !== null) {
    return selectableFixedValues.includes(previousTokenPointsLimit)
      ? previousTokenPointsLimit
      : MaxTokenPointsPercentageLimit;
  }

  return selectableFixedValues.includes(defaultTokenPointsPercentageLimit)
    ? defaultTokenPointsPercentageLimit
    : MaxTokenPointsPercentageLimit;
}

type TokenPointsLimitSelectProps = {
  defaultValue: string;
  onValueChange: (value: number) => void;
  disabled: boolean;
  pointsPercentageValues: number[];
  maxAvailablePercentage: number;
  lowerBoundary?: number;
};

export function TokenPointsLimitSelect({
  defaultValue,
  onValueChange,
  disabled,
  pointsPercentageValues,
  maxAvailablePercentage,
  lowerBoundary,
}: TokenPointsLimitSelectProps) {
  const t = useTranslations('custom-chat.share-with-learners');
  const selectableTokenPointsPercentageValues = getSelectableTokenPointsPercentageValues({
    pointsPercentageValues,
    maxAvailablePercentage,
    lowerBoundary,
  });

  return (
    <div className="whitespace-nowrap flex-1">
      <Field>
        <FieldLabel>{t('token-points')}</FieldLabel>
        <Select
          defaultValue={defaultValue}
          onValueChange={(value) => onValueChange(Number(value))}
          disabled={disabled}
        >
          <SelectTrigger aria-label={t('token-points')} data-testid="token-points-select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {selectableTokenPointsPercentageValues.map((value) => (
                <SelectItem
                  key={value}
                  value={String(value)}
                  data-testid={`token-points-option-${value}`}
                >
                  {value} %
                </SelectItem>
              ))}
              {maxAvailablePercentage > 0 && (
                <SelectItem
                  key="max"
                  value={String(MaxTokenPointsPercentageLimit)}
                  data-testid="token-points-option-max"
                >
                  {Math.floor(maxAvailablePercentage)} % ({t('maximum')})
                </SelectItem>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}
