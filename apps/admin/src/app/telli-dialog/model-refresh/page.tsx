import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import ModelRefreshView from './ModelRefreshView';
import { Sidebar, SidebarItem } from '@/components/navigation/Sidebar';
import { ROUTES } from '@/consts/routes';

export const dynamic = 'force-dynamic';

export default function ModelRefreshPage() {
  return (
    <TwoColumnLayout
      sidebar={
        <Sidebar>
          <SidebarItem label="Bundesländer" href={ROUTES.dialog.federalStates} />
          <SidebarItem label="Vorlagen" href={ROUTES.dialog.templates} />
          <SidebarItem label="Modelle aktualisieren" href={ROUTES.dialog.modelRefresh} />
        </Sidebar>
      }
      page={<ModelRefreshView />}
    />
  );
}
