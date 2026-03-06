'use client';

import {
  ChatTextIcon,
  ImageSquareIcon,
  LegoSmileyIcon,
  MoonStarsIcon,
  MountainsIcon,
  QuestionIcon,
  SidebarSimpleIcon,
  StudentIcon,
} from '@phosphor-icons/react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarSeparator,
  useSidebar,
} from '@telli/ui/components/Sidebar';
import { AppMenuItem } from './app-menu-item';
import TelliLogo from '@/components/icons/logo';
import { HELP_MODE_GPT_ID } from '@shared/db/const';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { MyTelliPoints } from './my-telli-points';
import { FederalStateModel } from '@shared/federal-states/types';
import { UserModel } from '@shared/auth/user-model';
import { useSidebarVisibility } from './sidebar-provider';
import { ChatHistory } from './chat-history';
import React from 'react';
import { IconButton } from '@ui/components/IconButton';
import Link from 'next/link';

type AppSidebarProps = {
  federalState: FederalStateModel;
  user: UserModel;
  currentModelCosts: number;
  userPriceLimit: number;
};

export function AppSidebar({
  federalState,
  user,
  currentModelCosts,
  userPriceLimit,
}: AppSidebarProps) {
  // Todo TD-1004: After ui redesign, we should switch to useSidebar()
  // const { toggleSidebar } = useSidebar();
  const { close, isOpen, toggle } = useSidebarVisibility();
  const { isMobile, openMobile } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('sidebar');

  function toggleTheme() {
    const currentTheme = resolvedTheme ?? 'light';
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
  }

  React.useEffect(() => {
    if (isMobile && isOpen && !openMobile) {
      close();
    }
  }, [close, isMobile, isOpen, openMobile]);

  return (
    <Sidebar>
      <div className="flex h-full min-h-0 flex-col p-2">
        <SidebarHeader>
          <div className="p-2 flex justify-end gap-2">
            <Link href="/" className="mr-auto">
              <TelliLogo className="h-7 text-primary" />
            </Link>
            <IconButton onClick={toggleTheme}>
              <MoonStarsIcon />
            </IconButton>
            <IconButton onClick={toggle} aria-label="Toggle sidebar">
              <SidebarSimpleIcon />
            </IconButton>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              <AppMenuItem href="/" icon={<ChatTextIcon />} text="Neuer Chat" />
              {federalState.featureToggles?.isImageGenerationEnabled && (
                <AppMenuItem
                  href="/image-generation"
                  icon={<ImageSquareIcon />}
                  text="Neues Bild"
                />
              )}
              {user.userRole === 'teacher' && federalState.featureToggles?.isCustomGptEnabled && (
                <AppMenuItem href="/custom" icon={<LegoSmileyIcon />} text="Assistenten" />
              )}
              <SidebarSeparator className="my-4" />
              {user.userRole === 'teacher' && federalState.featureToggles?.isSharedChatEnabled && (
                <AppMenuItem
                  href="/learning-scenarios"
                  icon={<MountainsIcon />}
                  text="Lernszenarien"
                />
              )}
              {user.userRole === 'teacher' && federalState.featureToggles?.isCharacterEnabled && (
                <AppMenuItem href="/characters" icon={<StudentIcon />} text="Dialogpartner" />
              )}
              <SidebarSeparator className="my-4" />
              {user.userRole === 'teacher' && federalState.featureToggles?.isCustomGptEnabled && (
                <AppMenuItem
                  href={`/custom/d/${HELP_MODE_GPT_ID}`}
                  icon={<QuestionIcon />}
                  text="Hilfe-Chat"
                />
              )}
            </SidebarMenu>
          </SidebarGroup>

          <SidebarGroup>
            <MyTelliPoints
              text={t('telli-points')}
              currentModelCosts={currentModelCosts}
              userPriceLimit={userPriceLimit}
            />
          </SidebarGroup>

          <SidebarGroup>
            <ChatHistory />
          </SidebarGroup>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}

export default AppSidebar;
