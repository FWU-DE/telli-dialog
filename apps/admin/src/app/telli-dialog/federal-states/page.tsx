import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import FederalStateListView from './FederalStateListView';
import { TelliDialogSidebar } from '../TelliDialogSidebar';

export const dynamic = 'force-dynamic';

export default function FederalStatesPage() {
  return <TwoColumnLayout sidebar={<TelliDialogSidebar />} page={<FederalStateListView />} />;
}
