/**
 *  This button is not part of shadcn but a custom one.
 * It is used for buttons that only contain an icon and no text, e.g. the sidebar toggle button in the app sidebar.
 * */
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '../lib/utils';

const iconButtonVariants = cva(
  'focus-visible:ring-2 focus-visible:ring-ring aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-lg border border-transparent aria-invalid:ring-2 inline-flex items-center justify-center transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none',
  {
    variants: {
      variant: {
        /* icons that use the primary color for the icon */
        primary: 'text-primary',
        /* destructive not styled yet */
        destructive:
          'bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30',
      },
      size: {
        md: "size-8 [&_svg:not([class*='size-'])]:size-6 hover:bg-primary-hover",
        lg: "size-10 [&_svg:not([class*='size-'])]:size-7 hover:bg-primary-hover",
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

function IconButton({
  className,
  variant = 'primary',
  size = 'md',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof iconButtonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(iconButtonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { IconButton, iconButtonVariants };
