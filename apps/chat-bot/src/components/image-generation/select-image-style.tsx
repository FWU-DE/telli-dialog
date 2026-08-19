'use client';

import React from 'react';
import { useImageStyle } from '../providers/image-style-provider';
import { useTranslations } from 'next-intl';
import { HeaderMainMenuItem } from '../layout/header-main-menu-item';
import { HeaderMenuItem } from '../layout/header-menu-item';
import { Separator } from '@ui/components/separator';

export default function SelectImageStyle() {
  const { selectableStyles, selectedStyle, setSelectedStyle } = useImageStyle();
  const t = useTranslations('image-generation.style');

  return (
    <HeaderMainMenuItem
      caption={t('label')}
      triggerLabel={selectedStyle?.displayName ?? t('no-style')}
      triggerAriaLabel={t('aria-label')}
    >
      {selectableStyles.map((style) => {
        return (
          <React.Fragment key={style.name}>
            <HeaderMenuItem
              onClick={() => setSelectedStyle(style.name === 'none' ? undefined : style)}
            >
              {style.displayName}
            </HeaderMenuItem>
            <Separator className="mx-2 border-b-0 last:hidden" />
          </React.Fragment>
        );
      })}
    </HeaderMainMenuItem>
  );
}
