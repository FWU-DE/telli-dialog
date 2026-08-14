'use client';

import { useImageAspectRatio } from './image-aspect-ratio-provider';
import { useTranslations } from 'next-intl';
import { CustomRectangleIcon } from '../icons/custom-rectangle-icon';
import { HeaderMainMenuItem } from '../layout/header-main-menu-item';
import { HeaderMenuItem } from '../layout/header-menu-item';

export default function SelectImageAspectRatio() {
  const { aspectRatio, setAspectRatio } = useImageAspectRatio();
  const t = useTranslations('image-generation.aspect-ratio');

  return (
    <HeaderMainMenuItem
      caption={t('label')}
      triggerLabel={t(aspectRatio)}
      triggerAriaLabel={t('aria-label')}
    >
      <HeaderMenuItem onClick={() => setAspectRatio('quadratic')}>
        <CustomRectangleIcon width={16} height={16} />
        {t('quadratic')}
      </HeaderMenuItem>
      <HeaderMenuItem onClick={() => setAspectRatio('portrait')}>
        <CustomRectangleIcon width={14} height={20} />
        {t('portrait')}
      </HeaderMenuItem>
      <HeaderMenuItem onClick={() => setAspectRatio('landscape')}>
        <CustomRectangleIcon width={20} height={14} />
        {t('landscape')}
      </HeaderMenuItem>
    </HeaderMainMenuItem>
  );
}
