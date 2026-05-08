import { Sidebar, SidebarItem } from '@/components/navigation/Sidebar';
import { ROUTES } from '@/consts/routes';

export function AdminAppSidebar() {
  return (
    <Sidebar>
      <SidebarItem label="Bundesländer" href={ROUTES.app.federalStates} />
      <SidebarItem label="Info-Banner" href={ROUTES.app.infoBanners} />
      <SidebarItem label="Vorlagen" href={ROUTES.app.templates} />
      <SidebarItem label="Modelle aktualisieren" href={ROUTES.app.modelRefresh} />
    </Sidebar>
  );
}
