'use client';

import { CaretRightIcon } from '@phosphor-icons/react/dist/icons/CaretRight';

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
    <div className="flex items-center px-6 py-4 justify-between text-base font-medium rounded-xl bg-secondary/30">
      <span>{info}</span>
      <a href={href} className="text-primary" onClick={handleClick}>
        {linkText}
        <CaretRightIcon className="inline-block size-4 text-primary mb-0.5 ml-1" />
      </a>
    </div>
  );
}
