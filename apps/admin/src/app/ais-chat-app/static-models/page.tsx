import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { AdminAppSidebar } from '../AdminAppSidebar';
import { getStaticModelConfigurationAction } from './actions';
import StaticModelConfigurationView from './StaticModelConfigurationView';

export const dynamic = 'force-dynamic';

export default async function StaticModelsPage() {
  const initialData = await getStaticModelConfigurationAction();

  return (
    <TwoColumnLayout
      sidebar={<AdminAppSidebar />}
      page={<StaticModelConfigurationView {...initialData} />}
    />
  );
}
