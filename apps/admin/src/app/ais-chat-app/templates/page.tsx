import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { AdminAppSidebar } from '../AdminAppSidebar';
import TemplateListView from './TemplateListView';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <TwoColumnLayout sidebar={<AdminAppSidebar />} page={<TemplateListView />} />;
}
