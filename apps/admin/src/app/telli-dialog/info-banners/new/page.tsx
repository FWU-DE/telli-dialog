import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { TelliDialogSidebar } from '../../TelliDialogSidebar';
import { getFederalStatesAction } from '../actions';
import InfoBannerEditorView from '../InfoBannerEditorView';

export const dynamic = 'force-dynamic';

export default async function NewInfoBannerPage() {
  const federalStates = await getFederalStatesAction();

  return (
    <TwoColumnLayout
      sidebar={<TelliDialogSidebar />}
      page={<InfoBannerEditorView federalStates={federalStates} />}
    />
  );
}
