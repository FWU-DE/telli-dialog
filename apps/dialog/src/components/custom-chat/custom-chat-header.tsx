'use client';

import type { ReactNode } from 'react';

type CustomChatHeaderProps = {
  children?: ReactNode;
};

export default function CustomChatHeader({ children }: CustomChatHeaderProps) {
  return <div className="flex items-center justify-end gap-4">{children}</div>;
}
