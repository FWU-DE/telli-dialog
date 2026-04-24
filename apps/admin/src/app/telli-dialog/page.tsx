import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { TelliDialogSidebar } from './TelliDialogSidebar';

export default function Page() {
  return <TwoColumnLayout sidebar={<TelliDialogSidebar />} page={<div></div>} />;
}
