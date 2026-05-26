import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { AdminAppSidebar } from '../AdminAppSidebar';
import { SuspensionListView } from './SuspensionListView';

export default function SuspensionsPage() {
  return <TwoColumnLayout sidebar={<AdminAppSidebar />} page={<SuspensionListView />} />;
}
