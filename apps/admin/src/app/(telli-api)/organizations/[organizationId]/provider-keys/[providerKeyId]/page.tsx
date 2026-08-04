import { notFound } from 'next/navigation';
import { getLargeLanguageModelsAction } from '../../llms/actions';
import { getProviderKeysAction } from '../actions';
import { ProviderKeyDetailView } from './ProviderKeyDetailView';

export const dynamic = 'force-dynamic';

export default async function ProviderKeyPage(
  props: PageProps<'/organizations/[organizationId]/provider-keys/[providerKeyId]'>,
) {
  const { organizationId, providerKeyId } = await props.params;
  const models = await getLargeLanguageModelsAction(organizationId);

  if (providerKeyId === 'new') {
    return <ProviderKeyDetailView organizationId={organizationId} models={models} mode="create" />;
  }

  const providerKeys = await getProviderKeysAction(organizationId);
  const providerKey = providerKeys.find(({ id }) => id === providerKeyId);
  if (!providerKey) notFound();

  return (
    <ProviderKeyDetailView
      organizationId={organizationId}
      providerKey={providerKey}
      models={models}
      mode="edit"
    />
  );
}
