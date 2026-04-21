'use client';

import { CaretLeftIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/Button';
import { useRouter } from 'next/navigation';

type BackButtonProps = {
  href: string;
  text: string;
  'aria-label': string;
  onClick?: () => void;
};

export function BackButton({ href, text, 'aria-label': ariaLabel, onClick }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      className="px-0 w-fit h-auto"
      variant="link"
      onClick={() => {
        if (onClick) {
          onClick();
          return;
        }

        router.push(href);
      }}
      aria-label={ariaLabel}
      data-testid="assistant-edit-back-button"
    >
      <CaretLeftIcon className="size-4" /> {text}
    </Button>
  );
}
