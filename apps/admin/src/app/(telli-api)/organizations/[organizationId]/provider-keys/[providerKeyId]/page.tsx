import { notFound } from 'next/navigation';
import { getProviderKeysAction } from '../actions';
import { ProviderKeyDetailView } from './ProviderKeyDetailView';

export const dynamic = 'force-dynamic';

export default async function ProviderKeyPage(
  props: PageProps<'/organizations/[organizationId]/provider-keys/[providerKeyId]'>,
) {
  const { organizationId, providerKeyId } = await props.params;
  if (providerKeyId === 'new') {
    return <ProviderKeyDetailView organizationId={organizationId} mode="create" />;
  }

  const result = await getProviderKeysAction(organizationId);
  if (!result.success) throw new Error(result.error.message);
  const providerKey = result.value.find(({ id }) => id === providerKeyId);
  if (!providerKey) notFound();

  return (
    <ProviderKeyDetailView organizationId={organizationId} providerKey={providerKey} mode="edit" />
  );
}
