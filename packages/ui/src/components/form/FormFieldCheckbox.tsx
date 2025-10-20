import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';
import { Input } from '../Input';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '../Field';
import { Checkbox } from '../Checkbox';

type FormFieldCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  control: Control<TFieldValues>;
  label: string;
  description?: string;
  disabled?: boolean;
};

export function FormFieldCheckbox<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  label,
  description,
  disabled = false,
}: FormFieldCheckboxProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <FieldSet data-invalid={fieldState.invalid}>
          <FieldLegend variant="label">{label}</FieldLegend>
          <FieldGroup data-slot="checkbox-group">
            <Field orientation="horizontal">
              <Checkbox
                id={field.name + '-checkbox'}
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
              <FieldLabel htmlFor={field.name + '-checkbox'}>{label}</FieldLabel>
            </Field>
          </FieldGroup>
          {description && <FieldDescription>{description}</FieldDescription>}
        </FieldSet>
      )}
    />
  );
}
