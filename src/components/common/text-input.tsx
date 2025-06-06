'use client';

import {
  SMALL_TEXT_INPUT_FIELDS_LIMIT,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';
import { cn } from '@/utils/tailwind';
import { inputFieldClassName, labelClassName } from '@/utils/tailwind/input';
import React from 'react';

export type TextInputType = 'text' | 'textarea';

export type TextInputProps<T extends HTMLTextAreaElement | HTMLInputElement> = Omit<
  React.InputHTMLAttributes<T>,
  'type'
> & {
  getValue: () => string;
  label: string;
  inputType?: TextInputType;
  readOnly?: boolean;
  maxLength?: number;
  rows?: number;
  className?: string;
  containerClassName?: string;
  labelClassName?: string;
  inputClassName?: string;
};

export function TextInput<T extends HTMLTextAreaElement | HTMLInputElement>({
  label,
  inputType = 'text',
  readOnly = false,
  className,
  rows = 5,
  containerClassName,
  labelClassName: customLabelClassName,
  inputClassName: customInputClassName,
  getValue,
  ...props
}: TextInputProps<T>) {
  const id = props.id || props.name;
  const defaultMaxLength =
    inputType === 'textarea' ? TEXT_INPUT_FIELDS_LENGTH_LIMIT : SMALL_TEXT_INPUT_FIELDS_LIMIT;

  const effectiveMaxLength: number | undefined = props.maxLength ?? defaultMaxLength;
  const [invalid, setInvalid] = React.useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const newValue = e.target.value;
    console.log('newValue', newValue);
    if (newValue.trim().length === 0 && props.required) {
      setInvalid(true);
      return;
    }

    setInvalid(false);
    if (props.onChange) {
      props.onChange(e as React.ChangeEvent<T>);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const currentValue = getValue();
    // if (currentValue === e.target.value) return;
    if (currentValue.trim().length === 0 && props.required) {
      console.log('currentValue is empty');
      e.preventDefault();
      e.stopPropagation();
      setInvalid(true);
      return;
    }
    if (props.onBlur !== undefined) {
      props.onBlur(e as React.FocusEvent<T, Element>);
    }
  };

  const borderErrorClass = invalid ? 'border-coral focus:border-coral' : '';

  return (
    <div className={cn('flex flex-col gap-4', containerClassName, className)}>
      <label htmlFor={id} className={cn(labelClassName, 'text-sm', customLabelClassName)}>
        {label} {props.required && <span className="text-coral">*</span>}
      </label>
      <div>
        {inputType === 'textarea' ? (
          <textarea
            className={cn(
              'w-full',
              inputFieldClassName,
              'focus:border-primary placeholder:text-gray-300',
              customInputClassName,
              'resize-none',
              borderErrorClass,
            )}
            rows={rows}
            readOnly={readOnly}
            maxLength={effectiveMaxLength}
            {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        ) : (
          <input
            type="text"
            className={cn(
              'w-full',
              inputFieldClassName,
              'focus:border-primary placeholder:text-gray-300',
              customInputClassName,
              borderErrorClass,
            )}
            readOnly={readOnly}
            {...(props as React.InputHTMLAttributes<HTMLInputElement>)}
            maxLength={effectiveMaxLength}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        )}
      </div>
    </div>
  );
}
