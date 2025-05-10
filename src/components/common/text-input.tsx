'use client';

import {
  SMALL_TEXT_INPUT_FIELDS_LIMIT,
  TEXT_INPUT_FIELDS_LENGTH_LIMIT,
} from '@/configuration-text-inputs/const';
import { cn } from '@/utils/tailwind';
import { inputFieldClassName, labelClassName } from '@/utils/tailwind/input';
import React from 'react';
import { useToast } from './toast';
import { useTranslations } from 'next-intl';

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

  const tCommon = useTranslations('common');

  const effectiveMaxLength: number | undefined = props.maxLength ?? defaultMaxLength;
  const toast = useToast();
  const [hasExceeded, setHasExceeded] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(getValue());

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    const newValue = e.target.value;
    console.log('newValue', newValue);
    setLocalValue(newValue);
    if (effectiveMaxLength && newValue.length >= effectiveMaxLength) {
      setHasExceeded(true);
      toast.error(tCommon('character-limit-reached'));

      return;
    }
    setHasExceeded(false);
    if (props.onChange) {
      props.onChange(e as React.ChangeEvent<T>);
    }
  };

  const borderErrorClass = hasExceeded ? 'border-coral focus:border-coral' : '';

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
          />
        )}
        <div className={cn('text-right p-2 text-xs text-gray-400', hasExceeded && 'text-coral')}>
          {typeof localValue === 'string' ? localValue.length : 0}/{effectiveMaxLength}
        </div>
      </div>
    </div>
  );
}
