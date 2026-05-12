'use client';

import React from 'react';
import Image from 'next/image';
import loadingTransparentGif from '@/assets/loading-transparent.gif';

interface LoadingAnimationProps {
  message?: string;
  className?: string;
}

export default function LoadingAnimation({
  message = 'Dein Bild wird generiert...',
  className = '',
}: LoadingAnimationProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center aspect-square border-2 border-none bg-gray-50 rounded-enterprise-md mb-4 ${className}`}
    >
      {/* TODO: When both gifs are combined, replace with loadingGif. */}
      <Image src={loadingTransparentGif} alt="Ladeanimation" width="107" height="107" unoptimized />
      <span className="text-gray-900 text-sm">{message}</span>
    </div>
  );
}
