'use client';

import React from 'react';
import Image from 'next/image';

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
      {/* TODO: When Gif is supplied, replace with the following line */}
      {/* <Image src="/loading.gif" alt="Ladeanimation" width="107" height="107" unoptimized /> */}
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <span className="text-gray-900 text-sm">{message}</span>
    </div>
  );
}
