'use client';

import Image from 'next/image';
import { EmptyImageIcon } from '../icons/empty-image';

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
        <EmptyImageIcon className="relative -left-1 -top-1 w-15 h-15" />
      )}
    </div>
  );
}
