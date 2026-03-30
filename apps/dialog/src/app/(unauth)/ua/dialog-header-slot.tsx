'use client';

import { useDialogHeader } from '@/components/providers/dialog-header-provider';

export default function UnauthDialogHeaderSlot() {
  const { content } = useDialogHeader();

  return <div className="w-full bg-white">{content}</div>;
}
