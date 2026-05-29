import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { AdminAppSidebar } from '../AdminAppSidebar';
import SuspendedEntitiesOverview from './SuspendedEntitiesOverview';

export const dynamic = 'force-dynamic';

export default async function SuspensionsPage() {
  return <TwoColumnLayout sidebar={<AdminAppSidebar />} page={<SuspendedEntitiesOverview />} />;
}
