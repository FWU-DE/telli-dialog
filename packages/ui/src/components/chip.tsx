/**
 * Chip component is based on shadcn badge component.
 * It adds a size variant and interactivity.
 * In ui systems badges are usually used for displaying static information.
 * Chips are used for displaying information that can be interacted with.
 */
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '../lib/utils';

const chipVariants = cva(
  cn(
    'group/badge flex w-fit shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full border font-medium leading-none whitespace-nowrap has-data-[icon=inline-end]:pr-1.0 has-data-[icon=inline-start]:pl-1.5',
    'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
    'has-[>a:focus-visible]:outline-none has-[>a:focus-visible]:ring-3 has-[>a:focus-visible]:ring-ring/50',
    '[&>a]:focus:outline-none [&>a]:focus-visible:outline-none',
  ),
  {
    variants: {
      variant: {
        default:
          'bg-primary/10 text-primary border-primary/30 [a&]:hover:bg-primary/20 has-[>a]:hover:bg-primary/20',
        secondary:
          'bg-secondary/30 text-secondary-foreground border-secondary [a&]:hover:bg-secondary/20',
        destructive:
          'bg-destructive/10 text-destructive border-destructive/30 [a&]:hover:bg-destructive/20',
      },
      size: {
        default: 'h-7 px-3 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Chip({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof chipVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="chip"
      data-variant={variant}
      data-size={size}
      className={cn(chipVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Chip, chipVariants };
