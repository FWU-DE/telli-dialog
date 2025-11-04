import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { Sidebar, SidebarItem } from '@/components/navigation/Sidebar';
import { ROUTES } from '@/consts/routes';

export default function Page() {
  return (
    <TwoColumnLayout
      sidebar={
        <Sidebar>
          <SidebarItem label="Bundesländer" href={ROUTES.dialog.federalStates} />
          <SidebarItem label="Dialogpartner" href={ROUTES.dialog.templates} />
        </Sidebar>
      }
      page={<div></div>}
    />
  );
}
