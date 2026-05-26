'use client';

import { ShieldWarningIcon } from '@phosphor-icons/react';
import { EntityType } from '@shared/suspension/suspension-service';
import { Button } from '@ui/components/button';
import { useMessages, useTranslations } from 'next-intl';
import { CustomChatCreateSuspensionDialog } from './custom-chat-create-suspension-dialog';

type CustomChatCreateSuspensionRequestProps = {
  entityType: EntityType;
};

export function CustomChatCreateSuspensionRequest({
  entityType,
}: CustomChatCreateSuspensionRequestProps) {
  const t = useTranslations('suspension');
  const messages = useMessages();

  return (
    <div className="flex justify-center">
      <CustomChatCreateSuspensionDialog
        entityType={entityType}
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
