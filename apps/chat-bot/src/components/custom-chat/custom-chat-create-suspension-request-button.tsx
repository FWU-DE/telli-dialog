'use client';

import { ShieldWarningIcon } from '@phosphor-icons/react';
import { SuspensionEntityRef } from '@shared/suspension/suspension-service';
import { Button } from '@ui/components/button';
import { useMessages } from 'next-intl';
import { CustomChatCreateSuspensionDialog } from './custom-chat-create-suspension-dialog';

type CustomChatCreateSuspensionRequestProps = {
  entityRef: SuspensionEntityRef;
};

export function CustomChatCreateSuspensionRequestButton({
  entityRef,
}: CustomChatCreateSuspensionRequestProps) {
  const messages = useMessages();
  const { entityType } = entityRef;

  return (
    <div className="flex justify-center">
      <CustomChatCreateSuspensionDialog
        entityRef={entityRef}
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
