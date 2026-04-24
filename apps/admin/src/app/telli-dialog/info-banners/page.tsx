import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { TelliDialogSidebar } from '../TelliDialogSidebar';
import InfoBannerListView from './InfoBannerListView';

export const dynamic = 'force-dynamic';

export default function InfoBannersPage() {
  return <TwoColumnLayout sidebar={<TelliDialogSidebar />} page={<InfoBannerListView />} />;
}
