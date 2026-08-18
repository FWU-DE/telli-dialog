import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import FederalStateListView from './FederalStateListView';
import { AdminAppSidebar } from '../AdminAppSidebar';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function FederalStatesPage() {
  return <TwoColumnLayout sidebar={<AdminAppSidebar />} page={<FederalStateListView />} />;
}
