import { Tooltip, TooltipContent, TooltipTrigger } from '../Tooltip';
import { Checkbox } from '../Checkbox';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';
import { FieldLabel, Field, FieldError } from '../Field';
import { InfoIcon } from 'lucide-react';

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
  tooltipLabel?: string;
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
  tooltipLabel = `Tooltip für Checkbox '${label}'`,
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
                  <InfoIcon className="size-5 text-icon" />
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
