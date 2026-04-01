'use client';

import * as React from 'react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';

import { DEFAULT_TOOLTIP_DELAY_DURATION } from './const';
import { cn } from '../lib/utils';

type TooltipContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const TooltipContext = React.createContext<TooltipContextType | undefined>(undefined);

function useTooltip() {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltip must be used within a Tooltip component');
  }
  return context;
}

function TooltipProvider({
  delayDuration = DEFAULT_TOOLTIP_DELAY_DURATION,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip({ onOpenChange, ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      setIsOpen(newOpen);
      onOpenChange?.(newOpen);
    },
    [onOpenChange],
  );

  return (
    <TooltipContext.Provider value={{ isOpen, setIsOpen: handleOpenChange }}>
      <TooltipPrimitive.Root
        data-slot="tooltip"
        open={isOpen}
        onOpenChange={handleOpenChange}
        {...props}
      />
    </TooltipContext.Provider>
  );
}

function TooltipTrigger({
  onKeyDown,
  onClick,
  onFocus,
  onBlur,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  const { isOpen, setIsOpen } = useTooltip();
  const focusTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (focusTimerRef.current !== null) {
        window.clearTimeout(focusTimerRef.current);
      }
    };
  }, []);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      // Allow toggling tooltip with Enter or Space key for key navigation accessibility
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setIsOpen(!isOpen);
      }
      onKeyDown?.(event as React.KeyboardEvent<HTMLButtonElement>);
    },
    [isOpen, setIsOpen, onKeyDown],
  );

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setIsOpen(!isOpen);
      onClick?.(event);
    },
    [isOpen, setIsOpen, onClick],
  );

  const handleFocus = React.useCallback(
    (event: React.FocusEvent<HTMLButtonElement>) => {
      const currentTarget = event.currentTarget;

      if (focusTimerRef.current !== null) {
        window.clearTimeout(focusTimerRef.current);
      }

      // Delay opening slightly so browser/container scroll can finish first.
      // This prevents that the tooltip vanishes on scrolling with key navigation
      focusTimerRef.current = window.setTimeout(() => {
        if (document.activeElement === currentTarget) {
          setIsOpen(true);
        }
      }, 75);

      onFocus?.(event);
    },
    [setIsOpen, onFocus],
  );

  const handleBlur = React.useCallback(
    (event: React.FocusEvent<HTMLButtonElement>) => {
      if (focusTimerRef.current !== null) {
        window.clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }

      setIsOpen(false);
      onBlur?.(event);
    },
    [setIsOpen, onBlur],
  );

  return (
    <TooltipPrimitive.Trigger
      data-slot="tooltip-trigger"
      onKeyDown={handleKeyDown}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...props}
    />
  );
}

function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          'whitespace-pre-line data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 rounded-md px-3 py-1.5 text-xs bg-foreground text-background z-50 w-fit max-w-xs origin-(--radix-tooltip-content-transform-origin)',
          className,
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="size-2.5 rotate-45 rounded-[2px] bg-foreground fill-foreground z-50 translate-y-[calc(-50%_-_2px)]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
