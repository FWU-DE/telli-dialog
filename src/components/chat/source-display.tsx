'use client';

import { parseHostname } from '@/app/api/conversation/tools/websearch/search-web';
import { cn } from '@/utils/tailwind';

type HoverDisplayProps = {
  title: string;
  previewText: string;
  uri: string;
  className?: string;
};

function getWebsiteAlias(title: string, hostname: string): string {
  const partsByPipe = title.split(' | ');
  const partsByDash = title.split(' - ');

  const websiteFromPipe = partsByPipe.length > 1 ? partsByPipe[1] : null;
  const websiteFromDash = partsByDash.length > 1 ? partsByDash[1] : null;
  if (websiteFromPipe) {
    return websiteFromPipe.trim();
  }
  if (websiteFromDash) {
    return websiteFromDash.trim();
  }
  return hostname.trim();
}

export default function SourceDisplayCard({ title, className, uri }: HoverDisplayProps) {
  const hostname = parseHostname(uri);
  const website = getWebsiteAlias(title, hostname);
  const titleWithoutWebsiteAlias = title.split('|')[0];
  const cardClassName = cn(
    'relative hover:bg-dark-gray hover:text-white bg-light-gray text-dark-gray group/source',
    className,
  );

  const hoverContentClassName = cn(
    'absolute left-0 top-6 bg-white',
    'group-hover/source:opacity-100 group-hover/source:visible opacity-0 invisible',
    'shadow-[0px_4px_9px_0px_rgba(0,41,102,0.20)] pb-2 pt-1 px-3 gap-3 z-10 w-[220px]',
    className,
  );

  return (
    <div className={cardClassName}>
      <a
        className="px-1 min-w-5 pb-0.5 text-center flex items-center justify-center leading-tight"
        href={uri}
        target="_blank"
        rel="noopener noreferrer"
      >
        <p className="truncate ... overflow-hidden max-w-[150px] text-xs font-normal">{hostname}</p>
      </a>
      <div className={hoverContentClassName}>
        <div className="text-black text-sm font-normal">{website}</div>
        <div className="text-gray-100 text-sm font-normal line-clamp-2">
          {titleWithoutWebsiteAlias}
        </div>
      </div>
    </div>
  );
}
