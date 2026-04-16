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
import { HELP_MODE_ASSISTANT_ID } from '@shared/db/const';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { MyTelliPoints } from './my-telli-points';
import { FederalStateModel } from '@shared/federal-states/types';
import { UserModel } from '@shared/auth/user-model';
import { ChatHistory } from './chat-history';
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
  const { toggleSidebar, open } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('sidebar');
  const isDarkTheme = resolvedTheme === 'dark';
  const lightThemeLabel = t('aria.toggle-light-theme');
  const darkThemeLabel = t('aria.toggle-dark-theme');

  function toggleTheme() {
    const currentTheme = resolvedTheme ?? 'light';
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
  }

  return (
    <Sidebar>
      <div className="flex h-full min-h-0 flex-col p-2">
        <SidebarHeader>
          <div className="p-2 flex justify-end gap-2">
            <Link
              href="/"
              aria-label={t('aria.home-link')}
              className="mr-auto rounded outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <TelliLogo className="h-7 text-primary" />
            </Link>
            <IconButton
              onClick={toggleTheme}
              aria-label={isDarkTheme ? lightThemeLabel : darkThemeLabel}
              aria-pressed={isDarkTheme}
            >
              <MoonStarsIcon />
            </IconButton>
            <IconButton
              onClick={toggleSidebar}
              aria-label={open ? t('aria.close-sidebar') : t('aria.open-sidebar')}
              aria-expanded={open}
            >
              <SidebarSimpleIcon />
            </IconButton>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <nav aria-label={t('aria.main-navigation')}>
              <SidebarMenu>
                <AppMenuItem href="/" icon={<ChatTextIcon />} text={t('new-chat')} />
                {federalState.featureToggles?.isImageGenerationEnabled && (
                  <AppMenuItem
                    href="/image-generation"
                    icon={<ImageSquareIcon />}
                    text={t('new-image')}
                  />
                )}
                {user.userRole === 'teacher' && federalState.featureToggles?.isCustomGptEnabled && (
                  <AppMenuItem
                    href="/assistants"
                    icon={<LegoSmileyIcon />}
                    text={t('assistants')}
                  />
                )}
                <SidebarSeparator className="my-6" />
                {user.userRole === 'teacher' &&
                  federalState.featureToggles?.isSharedChatEnabled && (
                    <AppMenuItem
                      href="/learning-scenarios"
                      icon={<MountainsIcon />}
                      text={t('learning-scenarios')}
                    />
                  )}
                {user.userRole === 'teacher' && federalState.featureToggles?.isCharacterEnabled && (
                  <AppMenuItem href="/characters" icon={<StudentIcon />} text={t('characters')} />
                )}
                <SidebarSeparator className="my-6" />
                {user.userRole === 'teacher' && federalState.featureToggles?.isCustomGptEnabled && (
                  <AppMenuItem
                    href={`/assistants/d/${HELP_MODE_ASSISTANT_ID}`}
                    icon={<QuestionIcon />}
                    text={t('help-chat')}
                  />
                )}
              </SidebarMenu>
            </nav>
          </SidebarGroup>

          <SidebarGroup className="mt-2">
            <MyTelliPoints
              text={t('telli-points')}
              currentModelCosts={currentModelCosts}
              userPriceLimit={userPriceLimit}
            />
          </SidebarGroup>

          <SidebarGroup className="mt-4">
            <ChatHistory />
          </SidebarGroup>
        </SidebarContent>
      </div>
    </Sidebar>
  );
}

export default AppSidebar;
