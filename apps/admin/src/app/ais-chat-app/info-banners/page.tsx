import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { AdminAppSidebar } from '../AdminAppSidebar';
import InfoBannerListView from './InfoBannerListView';

export default function InfoBannersPage() {
  return <TwoColumnLayout sidebar={<AdminAppSidebar />} page={<InfoBannerListView />} />;
}
