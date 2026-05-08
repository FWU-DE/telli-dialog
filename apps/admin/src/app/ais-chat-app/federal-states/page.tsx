import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import FederalStateListView from './FederalStateListView';
import { AdminAppSidebar } from '../AdminAppSidebar';

export const dynamic = 'force-dynamic';

export default function FederalStatesPage() {
  return <TwoColumnLayout sidebar={<AdminAppSidebar />} page={<FederalStateListView />} />;
}
