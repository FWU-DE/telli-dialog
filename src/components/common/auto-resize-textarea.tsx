'use client';

import { cn } from '@/utils/tailwind';
import React, { forwardRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, React.ComponentProps<'textarea'>>(
  ({ className, value, ...props }, ref) => {
    return (
      // @ts-expect-error - we need to pass the ref to the TextareaAutosize component
      <TextareaAutosize
        autoFocus
        className={cn(
          'w-full border-1 py-1.5 border-slate-400 focus:border-yellow-700 focus:outline-none resize-none',
          value === undefined || value.toString().length < 1 ? 'h-10' : 'h-fit',
          className,
        )}
        value={value}
        ref={ref}
        {...props}
      />
    );
  },
);

AutoResizeTextarea.displayName = 'AutoResizeTextarea';

export default AutoResizeTextarea;
