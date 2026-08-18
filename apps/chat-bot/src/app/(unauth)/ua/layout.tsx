import React from 'react';

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  return <div className="relative flex flex-col h-dvh w-dvw overflow-hidden">{children}</div>;
}
