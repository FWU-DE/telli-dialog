import { Sidebar, SidebarItem } from '@/components/navigation/Sidebar';
import { ROUTES } from '@/consts/routes';

export function TelliDialogSidebar() {
  return (
    <Sidebar>
      <SidebarItem label="Bundesländer" href={ROUTES.dialog.federalStates} />
      <SidebarItem label="Info-Banner" href={ROUTES.dialog.infoBanners} />
      <SidebarItem label="Vorlagen" href={ROUTES.dialog.templates} />
      <SidebarItem label="Modelle aktualisieren" href={ROUTES.dialog.modelRefresh} />
    </Sidebar>
  );
}
