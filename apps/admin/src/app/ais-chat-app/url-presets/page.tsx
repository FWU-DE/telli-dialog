import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { AdminAppSidebar } from '../AdminAppSidebar';
import { UrlPresetsListView } from './UrlPresetsListView';

export default function Page() {
  return <TwoColumnLayout sidebar={<AdminAppSidebar />} page={<UrlPresetsListView />} />;
}
