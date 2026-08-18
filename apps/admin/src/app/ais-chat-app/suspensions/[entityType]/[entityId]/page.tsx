import { EntityType } from '@shared/entities/entity-types';
import { AdminAppSidebar } from '@/app/ais-chat-app/AdminAppSidebar';
import TwoColumnLayout from '@/components/layout/TwoColumnLayout';
import { headers } from 'next/headers';
import { getChatBotEntityUrl } from '../../utils';
import { SuspensionRequestItemDetailView } from './SuspensionRequestItemDetailView';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function SuspensionRequestPage(
  props: PageProps<'/ais-chat-app/suspensions/[entityType]/[entityId]'>,
) {
  const { entityType, entityId } = await props.params;
  const host = (await headers()).get('host') ?? '';
  const chatBotEntityUrl = getChatBotEntityUrl(entityType as EntityType, entityId, host);

  return (
    <TwoColumnLayout
      sidebar={<AdminAppSidebar />}
      page={
        <SuspensionRequestItemDetailView
          entityType={entityType as EntityType}
          entityId={entityId}
          chatBotEntityUrl={chatBotEntityUrl}
        />
      }
    />
  );
}
