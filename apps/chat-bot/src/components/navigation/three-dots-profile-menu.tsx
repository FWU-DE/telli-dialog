'use client';

import React from 'react';
import { DotsThreeIcon } from '@phosphor-icons/react';
import { Button } from '@ui/components/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@ui/components/dropdown-menu';
import { type UserAndContext } from '@/auth/types';
import type { ApplicationHeaderMenuItem } from '@/components/layout/application-header';
import { ProfileMenuContent } from './profile-menu-content';

export type ThreeDotsProfileMenuItem = ApplicationHeaderMenuItem;

export function ThreeDotsProfileMenu({
  customItems,
  userAndContext,
}: {
  customItems?: ThreeDotsProfileMenuItem[];
  userAndContext?: UserAndContext;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-round"
          type="button"
          aria-label="More actions"
          title="More actions"
          className="text-primary"
        >
          <DotsThreeIcon weight="bold" className="size-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="z-300 flex flex-col gap-2 py-2 w-[256px] rounded-enterprise-md mb-4 bg-white shadow-dropdown"
      >
        {customItems?.map((item) => (
          <DropdownMenuItem
            key={item.id}
            disabled={item.disabled}
            onSelect={() => {
              if (item.disabled) {
                return;
              }

              item.onSelect();
            }}
            className="gap-2 text-base font-normal text-primary"
          >
            {item.icon !== undefined && <span aria-hidden="true">{item.icon}</span>}
            {item.label}
          </DropdownMenuItem>
        ))}
        {(customItems?.length ?? 0) > 0 && (
          <DropdownMenuSeparator className="border-gray-200 mx-2" />
        )}
        <ProfileMenuContent userAndContext={userAndContext} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
