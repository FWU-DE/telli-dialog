import { MainWithNavigation, NavItem } from '../../../../components/layout/MainWithNavigation';
import { fetchFederalStateById } from '../../../../services/federal-states-service';
import { FederalStateView } from './FederalStateDetailView';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ federalStateId: string }> }) {
  const federalStateId = (await params).federalStateId;
  const federalState = await fetchFederalStateById(federalStateId);

  const navItems: NavItem[] = [
    { label: 'Einstellungen', href: `/federal-states/${federalStateId}` },
    { label: 'API Key aktualisieren', href: `/federal-states/${federalStateId}/api-key` },
    { label: 'Guthaben Codes', href: `/federal-states/${federalStateId}/vouchers` },
  ];

  return (
    <MainWithNavigation navItems={navItems}>
      <FederalStateView federalState={federalState} />
    </MainWithNavigation>
  );
}
