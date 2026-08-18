import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { AdminAppSidebar } from '../AdminAppSidebar';
import SuspensionRequestEntitiesOverview from './SuspensionRequestEntitiesOverview';

export default async function SuspensionsPage() {
  return (
    <TwoColumnLayout sidebar={<AdminAppSidebar />} page={<SuspensionRequestEntitiesOverview />} />
  );
}
