import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import ModelRefreshView from './ModelRefreshView';
import { TelliDialogSidebar } from '../TelliDialogSidebar';

export const dynamic = 'force-dynamic';

export default function ModelRefreshPage() {
  return <TwoColumnLayout sidebar={<TelliDialogSidebar />} page={<ModelRefreshView />} />;
}
