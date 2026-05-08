import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import ModelRefreshView from './ModelRefreshView';
import { AdminAppSidebar } from '../AdminAppSidebar';

export const dynamic = 'force-dynamic';

export default function ModelRefreshPage() {
  return <TwoColumnLayout sidebar={<AdminAppSidebar />} page={<ModelRefreshView />} />;
}
