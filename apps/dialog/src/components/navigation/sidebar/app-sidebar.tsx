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
  SidebarSeparator,
  useSidebar,
} from '@telli/ui/components/Sidebar';
import { AppMenuItem } from './app-menu-item';
import TelliLogo from '@/components/icons/logo';
import { HELP_MODE_GPT_ID } from '@shared/db/const';
import { useTheme } from 'next-themes';
import { useTranslations } from 'next-intl';
import { MyTelliPoints } from './my-telli-points';

type AppSiderbarProps = {
  currentModelCosts: number;
  userPriceLimit: number;
};

export function AppSidebar({ currentModelCosts, userPriceLimit }: AppSiderbarProps) {
  const { toggleSidebar } = useSidebar();
  const { theme, setTheme } = useTheme();
  const t = useTranslations('sidebar');

  function toggleTheme() {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex justify-between">
          <TelliLogo className="h-7 text-primary" />
          <SidebarSimpleIcon className="w-6 h-6 text-primary" onClick={toggleSidebar} />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <AppMenuItem href="/" icon={<ChatTextIcon />} text="Neuer Chat" />
          <AppMenuItem href="/image-generation" icon={<ImageSquareIcon />} text="Neues Bild" />
          <AppMenuItem href="/custom" icon={<LegoSmileyIcon />} text="Assistenten" />
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <AppMenuItem href="/learning-scenarios" icon={<MountainsIcon />} text="Lernszenarien" />
          <AppMenuItem href="/characters" icon={<StudentIcon />} text="Dialogpartner" />
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <AppMenuItem
            href={`/custom/d/${HELP_MODE_GPT_ID}`}
            icon={<QuestionIcon />}
            text="Hilfe-Chat"
          />
        </SidebarGroup>
        <SidebarGroup>
          <MyTelliPoints
            text={t('telli-points')}
            currentModelCosts={currentModelCosts}
            userPriceLimit={userPriceLimit}
          />
        </SidebarGroup>
        <SidebarGroup>Chat History</SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <MoonStarsIcon onClick={toggleTheme} />
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
