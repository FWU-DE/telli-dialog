'use client';

import {
  SMALL_TEXT_INPUT_FIELDS_LIMIT,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';
import { cn } from '@/utils/tailwind';
import { inputFieldClassName, labelClassName } from '@/utils/tailwind/input';
import React from 'react';
import TextareaAutosize from 'react-textarea-autosize';

export type TextInputType = 'text' | 'textarea';

export type TextInputProps<T extends HTMLTextAreaElement | HTMLInputElement> = Omit<
  React.InputHTMLAttributes<T>,
  'type'
> & {
  label: string;
  required?: boolean;
  placeholder?: string;
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
  required = false,
  placeholder,
  inputType = 'text',
  readOnly = false,
  maxLength,
  className,
  rows = 5,
  containerClassName,
  labelClassName: customLabelClassName,
  inputClassName: customInputClassName,
  ...props
}: TextInputProps<T>) {
  const id = props.id || props.name;
  const defaultMaxLength =
    inputType === 'textarea' ? TEXT_INPUT_FIELDS_LENGTH_LIMIT : SMALL_TEXT_INPUT_FIELDS_LIMIT;
  const effectiveMaxLength: number | undefined = maxLength ?? defaultMaxLength;
  return (
    <div className={cn('flex flex-col gap-4', containerClassName, className)}>
      <label htmlFor={id} className={cn(labelClassName, 'text-sm', customLabelClassName)}>
        {required && <span className="text-coral">*</span>} {label}
      </label>
      {inputType === 'textarea' ? (
        <textarea
          className={cn(
            inputFieldClassName,
            'focus:border-primary placeholder:text-gray-300',
            customInputClassName,
            'resize-none'
          )}
          placeholder={placeholder}
          rows={rows}
          readOnly={readOnly}
          maxLength={effectiveMaxLength}
          {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>}
        />
      ) : (
        <input
          type="text"
          className={cn(
            inputFieldClassName,
            'focus:border-primary placeholder:text-gray-300',
            customInputClassName,
          )}
          placeholder={placeholder}
          readOnly={readOnly}
          maxLength={effectiveMaxLength}
          {...props as React.InputHTMLAttributes<HTMLInputElement> }
        />
      )}
    </div>
  );
}
