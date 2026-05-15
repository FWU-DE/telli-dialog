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
import { ProfileMenuContent } from './profile-menu-content';
import { MenuActionRow } from './menu-action-row';

export function ThreeDotsProfileMenu({
  downloadButtonJSX,
  deleteButtonJSX,
  userAndContext,
}: {
  downloadButtonJSX?: React.ReactNode;
  deleteButtonJSX?: React.ReactNode;
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
        {deleteButtonJSX && (
          <DropdownMenuItem asChild>
            <MenuActionRow action={deleteButtonJSX} />
          </DropdownMenuItem>
        )}
        {downloadButtonJSX && (
          <DropdownMenuItem asChild>
            <MenuActionRow action={downloadButtonJSX} />
          </DropdownMenuItem>
        )}
        {(deleteButtonJSX || downloadButtonJSX) && (
          <DropdownMenuSeparator className="border-gray-200 mx-2" />
        )}
        <ProfileMenuContent userAndContext={userAndContext} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
