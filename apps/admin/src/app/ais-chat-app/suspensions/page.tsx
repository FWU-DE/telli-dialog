import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { requireAdminAppAccess } from '@/auth/requireAdminAuth';
import { AdminAppSidebar } from '../AdminAppSidebar';
import SuspensionRequestEntitiesOverview from './SuspensionRequestEntitiesOverview';

export const dynamic = 'force-dynamic';

export default async function SuspensionsPage() {
  await requireAdminAppAccess();
  return (
    <TwoColumnLayout sidebar={<AdminAppSidebar />} page={<SuspensionRequestEntitiesOverview />} />
  );
}
