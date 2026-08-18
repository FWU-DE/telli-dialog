import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { AdminAppSidebar } from '../AdminAppSidebar';
import { UrlPresetsListView } from './UrlPresetsListView';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default function Page() {
  return <TwoColumnLayout sidebar={<AdminAppSidebar />} page={<UrlPresetsListView />} />;
}
