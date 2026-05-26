'use client';

import { ShieldWarningIcon } from '@phosphor-icons/react';
import { EntityType, SuspensionRequestTargetIds } from '@shared/suspension/suspension-service';
import { Button } from '@ui/components/button';
import { useMessages } from 'next-intl';
import { CustomChatCreateSuspensionDialog } from './custom-chat-create-suspension-dialog';

type CustomChatCreateSuspensionRequestProps = {
  entityType: EntityType;
  entityId: SuspensionRequestTargetIds;
};

export function CustomChatCreateSuspensionRequestButton({
  entityType,
  entityId,
}: CustomChatCreateSuspensionRequestProps) {
  const messages = useMessages();

  return (
    <div className="flex justify-center">
      <CustomChatCreateSuspensionDialog
        entityType={entityType}
        entityId={entityId}
        trigger={
          <Button variant="link" className="text-sm">
            <ShieldWarningIcon />
            {messages.suspension[entityType]['create-button-text']}
          </Button>
        }
      />
    </div>
  );
}
