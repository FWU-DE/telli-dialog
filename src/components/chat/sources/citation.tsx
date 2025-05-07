'use client';
import './citation.css';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils/tailwind';
import SearchIcon from '@/components/icons/search';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
import { useToast } from '@/components/common/toast';
import { useEffect, useState } from 'react';
import { parseHostname } from '@/utils/web-search/parsing';
import { defaultErrorSource } from './const';

function truncateText(text: string, maxLength: number) {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

async function fetchWebpageContent(url: string): Promise<WebsearchSource> {
  const response = await fetch(`/api/webpage-content?url=${encodeURIComponent(url)}`);
  console.log('response', response);
  if (!response.ok) {
    throw new Error('Failed to fetch webpage content');
  }
  return response.json() as Promise<WebsearchSource>;
}

export default function Citation({ source }: { source: WebsearchSource }) {
  const [data, setData] = useState<WebsearchSource | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const toast = useToast();
  const displayHostname = source.hostname || data?.hostname;
  const displayTitle = truncateText(source.name || data?.name || '', 25);
  console.log('source', source.link);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchWebpageContent(source.link);
        setData(result);
      } catch (err) {
        setData({
          ...defaultErrorSource,
          link: source.link,
          hostname: parseHostname(source.link),
        });
        setError(err as Error);
        toast.error('Fehler beim Laden der Seite');
      }
    };

    fetchData();
  }, [source.link]);

  return (
    <TooltipProvider skipDelayDuration={0} delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className="flex flex-row items-center bg-secondary/20 mr-4 gap-1 p-1.5"
            role="button"
            onClick={() => window.open(source.link, '_blank', 'noopener noreferrer')}
          >
            <SearchIcon className="w-3 h-3 ml-1" />
            <span className="flex overflow-ellipsis text-xs line-clamp-1">{displayTitle} | </span>
            <span className="flex-1 overflow-ellipsis text-xs line-clamp-1">{displayHostname}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent
          asChild
          className={cn(
            'p-4 flex flex-col border-0 bg-white w-60 cursor-pointer text-start citation overflow-hidden',
          )}
        >
          {!error && (
            <span
              role="button"
              onClick={() => window.open(source.link, '_blank', 'noopener noreferrer')}
            >
              <span className="font-medium overflow-ellipsis text-sm line-clamp-2">
                {data?.name}
              </span>
              {data?.content && data.content !== '' && (
                <span className="text-gray-500 text-sm line-clamp-2 break-words">
                  {data.content.trim()}
                </span>
              )}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
