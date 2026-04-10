'use client';

import { Control, Controller, FieldPath, FieldValues, useWatch } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '../Field';
import { Input } from '../Input';
import { Textarea } from '../Textarea';
import { useEffect, useRef } from 'react';

export type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  /** Field name from the form schema */
  name: TName;
  /** React Hook Form control object */
  control: Control<TFieldValues>;
  /** Translated label text */
  label: string;
  /** Description text displayed below the label */
  description?: string;
  /** Tooltip text displayed next to the label */
  tooltip?: string;
  /** Input type: 'text', 'textArea', 'number', 'email', 'password', or 'checkbox' */
  type?: 'text' | 'textArea' | 'number' | 'email' | 'password' | 'checkbox';
  /** Whether the field is required */
  required?: boolean;
  /** Maximum number of characters allowed */
  maxLength?: number;
  /** Error message shown when maxLength is reached */
  maxLengthErrorMessage?: string;
  /** Translated placeholder text */
  placeholder?: string;
  /** Whether the field is disabled */
  disabled?: boolean;
  /** Callback when field loses focus */
  onBlur?: () => void;
  /** CSS class name for the input component */
  className?: string;
  /** Test ID for the input element */
  testId?: string;
  /** When true, automatically focuses the input when its value is empty */
  autoFocusWhenEmpty?: boolean;
};

/**
 * Reusable form field component that automatically handles validation display,
 * maxLength constraints, error messages, and supports multiple input types.
 */
export function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  name,
  control,
  label,
  description,
  tooltip,
  type = 'text',
  required,
  maxLength,
  maxLengthErrorMessage,
  placeholder,
  disabled = false,
  onBlur,
  className,
  testId,
  autoFocusWhenEmpty,
}: FormFieldProps<TFieldValues, TName>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const value = useWatch({ control, name });

  useEffect(() => {
    const isEmptyValue = value === null || value === undefined || !String(value).trim();
    if (autoFocusWhenEmpty && isEmptyValue) {
      (type === 'textArea' ? textareaRef : inputRef).current?.focus();
    }
  }, [autoFocusWhenEmpty, value, type]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const sharedProps = {
          autoComplete: 'off',
          className,
          id: field.name,
          maxLength,
          maxLengthErrorMessage,
          placeholder,
          required,
          disabled,
          'aria-invalid': fieldState.invalid,
          'aria-label': label,
          'data-testid': testId,
          ...(!onBlur
            ? {}
            : {
                onBlur: () => {
                  field.onBlur();
                  onBlur();
                },
              }),
        };

        return (
          <Field data-invalid={fieldState.invalid} aria-required={required}>
            <FieldLabel htmlFor={field.name} required={required} tooltip={tooltip}>
              {label}
            </FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
            {type === 'textArea' ? (
              <Textarea {...field} {...sharedProps} ref={textareaRef} />
            ) : (
              <Input
                {...field}
                {...sharedProps}
                type={type}
                ref={inputRef}
                onChange={(e) => {
                  if (type === 'number') {
                    field.onChange(e.target.valueAsNumber);
                  } else {
                    field.onChange(e.target.value);
                  }
                }}
                onWheel={(e) => type === 'number' && (e.target as HTMLElement).blur()}
              />
            )}
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        );
      }}
    />
  );
}
