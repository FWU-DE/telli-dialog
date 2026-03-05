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
  SidebarFooter,
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
import { useOutsideClick } from '@/components/hooks/use-outside-click';
import { ChatHistorySidebarGroup } from './chat-history-sidebar-group';

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
  // Todo: After ui redesign, we should switch to useSidebar()
  // const { toggleSidebar } = useSidebar();
  const { close, isOpen, toggle } = useSidebarVisibility();
  const { isMobile } = useSidebar();
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations('sidebar');

  function toggleTheme() {
    const currentTheme = resolvedTheme ?? 'light';
    setTheme(currentTheme === 'light' ? 'dark' : 'light');
  }

  const ref = useOutsideClick<HTMLDivElement>(() => {
    if (isOpen && isMobile && typeof window !== 'undefined') {
      close();
    }
  });

  return (
    <Sidebar>
      <div ref={ref} className="p-4">
        <SidebarHeader>
          <div className="flex justify-between">
            <TelliLogo className="h-7 text-primary" />
            {/* Todo: create a separate component that is a button with click handler and icon, hover style, focusable, aria-label, etc. */}
            <SidebarSimpleIcon
              className="w-8 h-8 p-1 text-primary hover:bg-primary-hover rounded-enterprise-sm"
              onClick={toggle}
            />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-0">
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
            <ChatHistorySidebarGroup />
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <MoonStarsIcon onClick={toggleTheme} />
        </SidebarFooter>
      </div>
    </Sidebar>
  );
}

export default AppSidebar;
