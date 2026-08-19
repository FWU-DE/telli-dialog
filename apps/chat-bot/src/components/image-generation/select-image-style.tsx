'use client';

import React from 'react';
import { useImageStyle } from '../providers/image-style-provider';
import { useTranslations } from 'next-intl';
import { HeaderMainMenuItem } from '../layout/header-main-menu-item';
import { HeaderMenuItem } from '../layout/header-menu-item';
import { Separator } from '@ui/components/separator';

export default function SelectImageStyle() {
  const { styles, selectedStyle, setSelectedStyle } = useImageStyle();
  const t = useTranslations('image-generation.style');

  return (
    <HeaderMainMenuItem
      caption={t('label')}
      triggerLabel={selectedStyle?.displayName ?? t('no-style')}
      triggerAriaLabel={t('aria-label')}
    >
      {styles
        .filter((style) => {
          if (selectedStyle === undefined) {
            return style.name !== 'none';
          } else {
            return style.name !== selectedStyle.name;
          }
        })
        .map((style) => {
          return (
            <HeaderMenuItem
              key={style.name}
              onClick={() => setSelectedStyle(style.name === 'none' ? undefined : style)}
            >
              {style.displayName}
            </HeaderMenuItem>
          );
        })}
      <Separator className="mx-2 border-b-0 last:hidden" />
    </HeaderMainMenuItem>
  );
}
