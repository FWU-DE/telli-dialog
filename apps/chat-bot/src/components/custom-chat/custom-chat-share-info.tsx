'use client';

import { CaretRightIcon } from '@phosphor-icons/react';

export function CustomChatShareInfo({
  href,
  info,
  linkText,
}: {
  href: string;
  info: string;
  linkText: string;
}) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const targetId = href.startsWith('#') ? href.slice(1) : null;

    if (!targetId) {
      return;
    }

    const targetElement = document.getElementById(targetId);
    if (!targetElement) {
      return;
    }

    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex min-h-16 flex-col items-start px-6 py-4 text-base font-medium rounded-xl bg-secondary/30 sm:justify-between sm:flex-row sm:items-center gap-1">
      <span className="min-w-0">{info}</span>
      <a
        href={href}
        className="inline-flex items-center whitespace-nowrap shrink-0 text-primary border border-transparent bg-clip-padding bg-transparent p-0 text-right text-sm outline-none transition-all focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 rounded-lg"
        onClick={handleClick}
      >
        {linkText}
        <CaretRightIcon className="inline-block size-4 text-primary mb-0.5 ml-1" />
      </a>
    </div>
  );
}
