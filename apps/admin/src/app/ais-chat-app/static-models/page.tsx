import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { AdminAppSidebar } from '../AdminAppSidebar';
import { getStaticModelConfigurationAction } from './actions';
import StaticModelConfigurationView from './StaticModelConfigurationView';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function StaticModelsPage() {
  const result = await getStaticModelConfigurationAction();
  if (!result.success) throw new Error(result.error.message);

  return (
    <TwoColumnLayout
      sidebar={<AdminAppSidebar />}
      page={<StaticModelConfigurationView {...result.value} />}
    />
  );
}
