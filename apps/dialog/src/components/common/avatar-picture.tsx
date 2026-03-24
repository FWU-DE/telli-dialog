import Image from 'next/image';
import React from 'react';

type AvatarPictureProps = {
  src: string;
  alt: string;
  variant?: 'small' | 'normal' | 'large' | 'customChatLarge';
};

const VARIANT_STYLES = {
  small: {
    width: 44,
    height: 44,
    className: 'rounded-enterprise-sm object-contain min-w-[44px] min-h-[44px]',
  },
  normal: {
    width: 100,
    height: 100,
    className: 'rounded-enterprise-md object-contain min-w-[100px] min-h-[100px]',
  },
  large: {
    width: 170,
    height: 170,
    className: 'rounded-enterprise-md object-contain min-w-[170px] min-h-[170px]',
  },
  customChatLarge: {
    width: 140,
    height: 140,
    className: 'rounded-full object-contain w-[140px] h-[140px]',
  },
};

export default function AvatarPicture({ src, alt, variant = 'normal' }: AvatarPictureProps) {
  const { width, height, className } = VARIANT_STYLES[variant];
  return (
    <Image src={src} width={width} height={height} unoptimized alt={alt} className={className} />
  );
}
