import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import FederalStateListView from './FederalStateListView';
import { Sidebar, SidebarItem } from '@/components/navigation/Sidebar';
import { ROUTES } from '@/consts/routes';

export const dynamic = 'force-dynamic';

export default function FederalStatesPage() {
  return (
    <TwoColumnLayout
      sidebar={
        <Sidebar>
          <SidebarItem label="Bundesländer" href={ROUTES.dialog.federalStates} />
          <SidebarItem label="Vorlagen" href={ROUTES.dialog.templates} />
        </Sidebar>
      }
      page={<FederalStateListView />}
    />
  );
}
