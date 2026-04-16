import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip';
import { Checkbox } from '../Checkbox';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '../Field';
import { InfoIcon } from '@phosphor-icons/react';

type CheckboxWithInfoProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  label: string;
  tooltip: string;
  control: Control<TFieldValues>;
  disabled?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

export default function CheckboxWithInfo<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  label,
  control,
  tooltip,
  disabled,
  onCheckedChange,
}: CheckboxWithInfoProps<TFieldValues, TName>) {
  return (
    <div className="flex items-center gap-1">
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} orientation="horizontal">
            <Checkbox
              id={field.name + '-checkbox'}
              aria-label={label}
              checked={field.value}
              onCheckedChange={(checked) => {
                field.onChange(checked);
                onCheckedChange?.(checked === true);
              }}
              disabled={disabled}
            />
            <FieldLabel htmlFor={field.name + '-checkbox'} size="normal">
              {label}
            </FieldLabel>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            {tooltip && (
              <Tooltip>
                <TooltipTrigger aria-label={tooltip}>
                  <InfoIcon className="size-5 text-icon" aria-hidden="true" />
                </TooltipTrigger>
                <TooltipContent>{tooltip}</TooltipContent>
              </Tooltip>
            )}
          </Field>
        )}
      />
    </div>
  );
}
