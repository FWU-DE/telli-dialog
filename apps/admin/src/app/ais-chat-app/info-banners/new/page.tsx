import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { AdminAppSidebar } from '../../AdminAppSidebar';
import { getFederalStatesAction } from '../actions';
import InfoBannerEditorView from '../InfoBannerEditorView';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function NewInfoBannerPage() {
  const federalStates = await getFederalStatesAction();

  return (
    <TwoColumnLayout
      sidebar={<AdminAppSidebar />}
      page={<InfoBannerEditorView federalStates={federalStates} />}
    />
  );
}
