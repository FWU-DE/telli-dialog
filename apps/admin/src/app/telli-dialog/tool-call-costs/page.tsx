import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { TelliDialogSidebar } from '../TelliDialogSidebar';
import ToolCallCostListView from './ToolCallCostListView';

export const dynamic = 'force-dynamic';

export default function ToolCallCostsPage() {
  return <TwoColumnLayout sidebar={<TelliDialogSidebar />} page={<ToolCallCostListView />} />;
}
