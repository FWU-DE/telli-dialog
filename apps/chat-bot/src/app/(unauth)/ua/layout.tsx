import React from 'react';

export const dynamic = 'force-dynamic';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  return <div className="relative flex flex-col h-dvh w-dvw overflow-hidden">{children}</div>;
}
