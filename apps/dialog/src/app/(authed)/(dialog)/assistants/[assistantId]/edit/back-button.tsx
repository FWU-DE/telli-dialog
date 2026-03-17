'use client';

import { CaretLeftIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/Button';
import { useRouter } from 'next/navigation';

type BackButtonProps = {
  href: string;
  text: string;
  'aria-label': string;
};

export function BackButton({ href, text, 'aria-label': ariaLabel }: BackButtonProps) {
  const router = useRouter();

  return (
    <Button
      className="px-0"
      variant="link"
      onClick={() => router.push(href)}
      aria-label={ariaLabel}
    >
      <CaretLeftIcon className="size-4" /> {text}
    </Button>
  );
}
