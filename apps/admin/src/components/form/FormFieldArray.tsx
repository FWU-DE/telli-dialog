'use client';
import { Button } from '@ui/components/Button';
import { Input } from '@ui/components/Input';
import { Controller, Control, useFieldArray } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLegend, FieldSet } from '@ui/components/Field';

export type FormFieldArrayProps = {
  name: string;
  label: string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  inputType?: string;
};

export function FormFieldArray({
  name,
  label,
  description,
  control,
  inputType = 'text',
}: FormFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  return (
    <FieldSet>
      <FieldLegend variant="label">{label}</FieldLegend>
      <FieldDescription>{description}</FieldDescription>
      <div className="flex flex-col gap-2">
        {fields.map((item, index) => (
          <div key={item.id} className="flex gap-2">
            <Controller
              name={`${name}.${index}.value`}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex flex-row gap-2">
                    <Input {...field} id={`${name}.${index}.name`} type={inputType} />
                    <Button type="button" variant="destructive" onClick={() => remove(index)}>
                      Entfernen
                    </Button>
                  </div>
                  <FieldError>{fieldState.error?.message}</FieldError>
                </Field>
              )}
            />
          </div>
        ))}
        <Button type="button" onClick={() => append({ value: '' })}>
          Hinzufügen
        </Button>
      </div>
    </FieldSet>
  );
}
