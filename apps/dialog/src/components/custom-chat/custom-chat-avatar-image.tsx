'use client';

import Image from 'next/image';
import { ImageSquareIcon } from '@phosphor-icons/react';

export function CustomChatAvatarImage({ pictureUrl }: { pictureUrl: string | undefined }) {
  return (
    <div className="relative w-35 h-35 justify-center items-center flex">
      {pictureUrl ? (
        <Image
          src={pictureUrl}
          fill
          unoptimized
          alt={'profile-picture'}
          className="rounded-full object-contain"
        />
      ) : (
        <div className="rounded-full bg-primary/7 flex items-center justify-center w-full h-full">
          <ImageSquareIcon className="text-primary/30 rounded-full size-18" weight="thin" />
        </div>
      )}
    </div>
  );
}
