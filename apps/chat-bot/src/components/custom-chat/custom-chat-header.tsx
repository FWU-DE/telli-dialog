'use client';

import {
  CustomChatFormState,
  type CustomChatFormStateProps,
} from '@/components/custom-chat/custom-chat-form-state';

type CustomChatHeaderProps = {
  showFormState?: boolean;
  formStateProps?: CustomChatFormStateProps;
};

export default function CustomChatHeader({
  showFormState = false,
  formStateProps,
}: CustomChatHeaderProps) {
  return (
    <div className="flex items-center justify-end gap-4">
      {showFormState && formStateProps ? <CustomChatFormState {...formStateProps} /> : null}
    </div>
  );
}
