import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { TelliDialogSidebar } from '../TelliDialogSidebar';
import TemplateListView from './TemplateListView';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <TwoColumnLayout sidebar={<TelliDialogSidebar />} page={<TemplateListView />} />;
}
