import Image from 'next/image';
import React from 'react';

type AvatarPictureProps = {
  src: string;
  alt: string;
  variant?: 'small' | 'normal' | 'large';
};

const VARIANT_STYLES = {
  small: {
    width: 44,
    height: 44,
    className: 'rounded-enterprise-sm',
  },
  normal: {
    width: 100,
    height: 100,
    className: 'rounded-enterprise-md',
  },
  large: {
    width: 170,
    height: 170,
    className: 'rounded-enterprise-md',
  },
};

export default function AvatarPicture({ src, alt, variant = 'normal' }: AvatarPictureProps) {
  const { width, height, className } = VARIANT_STYLES[variant];
  return (
    <Image src={src} width={width} height={height} unoptimized alt={alt} className={className} />
  );
}
