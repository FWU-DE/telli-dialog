'use client';
import './citation.css';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils/tailwind';
import { useQuery } from '@tanstack/react-query';

function parseHostname(uri: string) {
  return new URL(uri).hostname.replace(/^www\./, '');
}

async function fetchWebpageMetadata(url: string) {
  const response = await fetch(`/api/webpage-metadata?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch webpage metadata');
  }
  return response.json();
}

export default function Citation({
  source,
}: {
  source: {
    link: string;
  };
}) {
  const hostname = parseHostname(source.link);
  const { data, error } = useQuery({
    queryKey: ['webpageMetadata', source.link],
    queryFn: () => fetchWebpageMetadata(source.link),
  });
  const titleWithoutWebsiteAlias = data?.title.split('|')[0];
  console.log(data);
  return (
    <TooltipProvider skipDelayDuration={0} delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="button"
            onClick={() => window.open(source.link, '_blank', 'noopener noreferrer')}
            className={cn(
              'text-[12px] font-light px-1 pt-[1px] min-w-4 w-fit min-h-4 text-center inline-block ml-1',
              {
                'bg-[#2684FF] text-white': true,
              },
            )}
            style={{
              lineHeight: '12px',
            }}
          >
            {titleWithoutWebsiteAlias}
          </span>
        </TooltipTrigger>
        <TooltipContent
          asChild
          className={cn(
            'p-4 flex flex-col border-0 bg-white w-60 cursor-pointer text-start citation overflow-hidden',
          )}
        >
          <span
            role="button"
            onClick={() => window.open(source.link, '_blank', 'noopener noreferrer')}
          >
            <span className="flex leading-none items-center gap-2 p-1">
              <span className="text-grey-500 text-xs overflow-ellipsis overflow-hidden w-full hover:underline text-nowrap">
                {hostname}
              </span>
            </span>
            <span className="font-medium overflow-ellipsis text-sm line-clamp-2">
              {titleWithoutWebsiteAlias}
            </span>
            {data?.description && data.description !== '' && (
              <span className="text-gray-500 text-sm line-clamp-2 break-words">
                {data.description.trim()}
              </span>
            )}
          </span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
