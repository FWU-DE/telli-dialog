import Image from 'next/image';
import React from 'react';

const VARIANT_STYLES = {
  small: {
    width: 44,
    height: 44,
    className: 'rounded-enterprise-sm object-contain min-w-[44px] min-h-[44px]',
  },
  smallCircle: {
    width: 60,
    height: 60,
    className: 'rounded-full object-cover w-15 h-15',
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
};

type AvatarPictureProps = {
  src: string;
  alt: string;
  variant?: keyof typeof VARIANT_STYLES;
};

export default function AvatarPicture({ src, alt, variant = 'normal' }: AvatarPictureProps) {
  const { width, height, className } = VARIANT_STYLES[variant];
  return (
    <Image src={src} width={width} height={height} unoptimized alt={alt} className={className} />
  );
}
