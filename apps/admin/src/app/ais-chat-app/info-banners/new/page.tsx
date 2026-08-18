import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { AdminAppSidebar } from '../../AdminAppSidebar';
import { getFederalStatesAction } from '../actions';
import InfoBannerEditorView from '../InfoBannerEditorView';

export default async function NewInfoBannerPage() {
  const federalStates = await getFederalStatesAction();

  return (
    <TwoColumnLayout
      sidebar={<AdminAppSidebar />}
      page={<InfoBannerEditorView federalStates={federalStates} />}
    />
  );
}
