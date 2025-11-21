import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { Sidebar, SidebarItem } from '@/components/navigation/Sidebar';
import { ROUTES } from '@/consts/routes';

export default function Page() {
  return (
    <TwoColumnLayout
      sidebar={
        <Sidebar>
          <SidebarItem label="Bundesländer" href={ROUTES.dialog.federalStates} />
          <SidebarItem label="Vorlagen" href={ROUTES.dialog.templates} />
          <SidebarItem label="Modelle aktualisieren" href={ROUTES.dialog.modelRefresh} />
        </Sidebar>
      }
      page={<div></div>}
    />
  );
}
