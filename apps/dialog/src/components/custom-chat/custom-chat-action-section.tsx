import { CustomChatActions } from './custom-chat-actions';
import { CustomChatActionUse } from './custom-chat-action-use';
import { CustomChatActionDuplicate } from './custom-chat-action-duplicate';
import { CustomChatActionDelete } from './custom-chat-action-delete';
import { CustomChatActionSave } from './custom-chat-action-save';
import { CustomChatFormState } from './custom-chat-form-state';

export function CustomChatActionSection({
  onUse,
  onDuplicate,
  onDelete,
  onSave,
  isDirty,
  isSubmitting,
  hasSaveError,
}: {
  onUse: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSave: () => void;
  isDirty: boolean;
  isSubmitting: boolean;
  hasSaveError?: boolean;
}) {
  return (
    <div className="flex flex-row justify-between">
      <CustomChatActions>
        <CustomChatActionUse onClick={onUse} />
        <CustomChatActionDuplicate onClick={onDuplicate} />
        <CustomChatActionDelete onClick={onDelete} />
        <CustomChatActionSave onClick={onSave} />
      </CustomChatActions>
      <CustomChatFormState
        isDirty={isDirty}
        isSubmitting={isSubmitting}
        hasSaveError={hasSaveError}
      />
    </div>
  );
}
