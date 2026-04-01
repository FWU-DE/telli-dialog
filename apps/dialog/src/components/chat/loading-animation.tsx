'use client';

import Image from 'next/image';
import loadingGif from '@/assets/loading.gif';

export default function LoadingAnimation() {
  return (
    <div className="text-secondary-foreground w-fit m-4">
      <Image src={loadingGif} alt="Ladeanimation" width="107" height="107" unoptimized />
    </div>
  );
}
