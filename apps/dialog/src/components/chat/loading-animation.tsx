'use client';

import Image from 'next/image';
import { getLoadingMessage } from './loading-animation-messages';
import { useState } from 'react';

type LoadingAnimationProps = { isExternalResourceUsed?: boolean };

export default function LoadingAnimation({
  isExternalResourceUsed = false,
}: LoadingAnimationProps) {
  const [message] = useState<string>(getLoadingMessage(isExternalResourceUsed));

  return (
    <div className="text-secondary-foreground w-fit m-4">
      <Image src="/loading.gif" alt="Ladeanimation" width="107" height="107" />
      <span>{message}</span>
    </div>
  );
}
