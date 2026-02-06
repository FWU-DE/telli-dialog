'use client';

import Image from 'next/image';

export default function LoadingAnimation() {
  return (
    <div className="text-secondary-foreground w-fit m-4">
      <Image src="/loading.gif" alt="Ladeanimation" width="107" height="107" unoptimized />
    </div>
  );
}
