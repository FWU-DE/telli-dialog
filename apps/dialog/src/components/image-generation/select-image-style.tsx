'use client';

import React, { startTransition } from 'react';
import { useImageStyle } from '../providers/image-style-provider';
import { useTranslations } from 'next-intl';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useSidebarVisibility } from '../navigation/sidebar/sidebar-provider';
import { cn } from '@/utils/tailwind';
import { iconClassName } from '@/utils/tailwind/icon';
import { ImageStyle } from '@shared/utils/chat';

export default function SelectImageStyle() {
  const { styles, selectedStyle, setSelectedStyle } = useImageStyle();
  useSidebarVisibility();
  const tImageGeneration = useTranslations('image-generation');

  async function handleSelectStyle(style: ImageStyle | undefined) {
    startTransition(() => {
      setOptimisticStyle(style);
    });
    setSelectedStyle(style);
  }

  const [optimisticStyle, setOptimisticStyle] = React.useOptimistic(selectedStyle);

  return (
    <div className="flex flex-col gap-2 hover:bg-secondary/20 rounded-enterprise-md p-2">
      <span className="text-xs text-gray-400 hidden sm:block">
        {tImageGeneration('style-label')}
      </span>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild className="cursor-pointer focus:outline-none">
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer"
            aria-label="Select Style Dropdown"
          >
            <span className="text-primary text-base font-medium">
              {optimisticStyle?.displayName ?? tImageGeneration('no-style')}
            </span>
            <ChevronDown className="text-primary" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content
          className={cn('flex flex-col bg-white shadow-dropdown rounded-xl ml-0')}
          sideOffset={10}
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
                <React.Fragment key={style.name}>
                  <DropdownMenu.Item asChild>
                    <button
                      className={cn(
                        'hover:bg-primary-hover text-left py-6 px-7 outline-none flex flex-col',
                        iconClassName,
                      )}
                      onClick={() => handleSelectStyle(style.name === 'none' ? undefined : style)}
                      aria-label={`Select ${style.displayName} Style`}
                    >
                      <div className="flex gap-2 items-center">
                        <span>{style.displayName}</span>
                      </div>
                    </button>
                  </DropdownMenu.Item>
                  <hr className="text-gray-200 mx-2 last:mb-2 last:hidden" />
                </React.Fragment>
              );
            })}
        </DropdownMenu.Content>
      </DropdownMenu.Root>
    </div>
  );
}

function ChevronDown(props: React.ComponentProps<'svg'>) {
  return (
    <svg
      width="11"
      height="7"
      viewBox="0 0 11 7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M10.3331 0.199951L11 0.911514L5.5 6.79995L-3.11034e-08 0.911513L0.663437 0.199951L5.5 5.37339L10.3331 0.199951Z"
        fill="currentColor"
      />
    </svg>
  );
}
