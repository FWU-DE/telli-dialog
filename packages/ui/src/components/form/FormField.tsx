import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';
import { Input } from '../Input';
import { Field, FieldDescription, FieldError, FieldLabel } from '../Field';
import { Textarea } from '../Textarea';

type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
  control: Control<TFieldValues>;
  label: string;
  description?: string;
  type?: 'text' | 'textArea' | 'number' | 'email' | 'password' | 'checkbox';
  disabled?: boolean;
};

export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  label,
  description,
  type = 'text',
  disabled = false,
}: FormFieldProps<TFieldValues, TName>) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          {description && <FieldDescription>{description}</FieldDescription>}
          {type === 'textArea' ? (
            <Textarea {...field} id={field.name} disabled={disabled} />
          ) : (
            <Input
              {...field}
              id={field.name}
              type={type}
              disabled={disabled}
              onChange={(e) => {
                if (type === 'number') {
                  field.onChange(e.target.valueAsNumber);
                } else {
                  field.onChange(e.target.value);
                }
              }}
              onWheel={(e) => (e.target as HTMLElement).blur()} // ignore wheel events to prevent changing number inputs inadvertently
            />
          )}
          <FieldError>{fieldState.error?.message}</FieldError>
        </Field>
      )}
    />
  );
}
