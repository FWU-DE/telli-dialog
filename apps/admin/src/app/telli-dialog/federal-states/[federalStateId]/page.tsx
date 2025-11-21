import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { getFederalStateByIdAction } from './actions';
import { FederalStateView } from './FederalStateDetailView';
import { Sidebar, SidebarItem } from '@/components/navigation/Sidebar';
import { ROUTES } from '@/consts/routes';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ federalStateId: string }> }) {
  const { federalStateId } = await params;
  const federalState = await getFederalStateByIdAction(federalStateId);

  return (
    <TwoColumnLayout
      sidebar={
        <Sidebar>
          <SidebarItem label="API Key aktualisieren" href={ROUTES.dialog.apiKey(federalStateId)} />
          <SidebarItem label="Guthaben Codes" href={ROUTES.dialog.vouchers(federalStateId)} />
        </Sidebar>
      }
      page={<FederalStateView federalState={federalState} />}
    />
  );
}
