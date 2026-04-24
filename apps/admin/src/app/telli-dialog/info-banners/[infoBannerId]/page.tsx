import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { TelliDialogSidebar } from '../../TelliDialogSidebar';
import {
  getFederalStatesAction,
  getFederalStatesWithInfoBannerMappingsAction,
  getInfoBannerByIdAction,
} from '../actions';
import InfoBannerEditorView from '../InfoBannerEditorView';

export const dynamic = 'force-dynamic';

export default async function InfoBannerDetailPage(
  props: PageProps<'/telli-dialog/info-banners/[infoBannerId]'>,
) {
  const { infoBannerId } = await props.params;
  const [federalStates, infoBanner, mappings] = await Promise.all([
    getFederalStatesAction(),
    getInfoBannerByIdAction(infoBannerId),
    getFederalStatesWithInfoBannerMappingsAction(infoBannerId),
  ]);

  return (
    <TwoColumnLayout
      sidebar={<TelliDialogSidebar />}
      page={
        <InfoBannerEditorView
          federalStates={federalStates}
          infoBanner={infoBanner}
          mappings={mappings}
        />
      }
    />
  );
}
