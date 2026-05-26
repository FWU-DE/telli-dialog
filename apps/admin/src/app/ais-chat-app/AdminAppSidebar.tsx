import { Sidebar, SidebarItem } from '@/components/navigation/Sidebar';
import { ROUTES } from '@/consts/routes';

export function AdminAppSidebar() {
  return (
    <Sidebar>
      <SidebarItem label="Bundesländer" href={ROUTES.app.federalStates} />
      <SidebarItem label="Info-Banner" href={ROUTES.app.infoBanners} />
      <SidebarItem label="Tool Call Kosten" href={ROUTES.app.toolCallCosts} />
      <SidebarItem label="Vorlagen" href={ROUTES.app.templates} />
      <SidebarItem label="Sperrungen" href={ROUTES.app.suspensions} />
    </Sidebar>
  );
}
