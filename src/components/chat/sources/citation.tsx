'use client';
import './citation.css';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils/tailwind';
import SearchIcon from '@/components/icons/search';
import { WebsearchSource } from '@/app/api/conversation/tools/websearch/types';
import { useToast } from '@/components/common/toast';
import { useQuery } from '@tanstack/react-query';
import { parseHostname } from '@/utils/web-search/parsing';
import { useTranslations } from 'next-intl';
import TrashIcon from '@/components/icons/trash';

function truncateText(text: string, maxLength: number) {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

async function fetchWebpageContent(url: string): Promise<WebsearchSource> {
  const response = await fetch(`/api/webpage-content?url=${encodeURIComponent(url)}`);
  return (await response.json()) as WebsearchSource;
}

export default function Citation({
  source,
  index,
  sourceIndex,
  handleDelete,
  className,
}: {
  source: WebsearchSource;
  index: number;
  sourceIndex: number;
  handleDelete?: () => void;
  className?: string;
}) {
  const t = useTranslations('websearch');
  const toast = useToast();
  const { data, isLoading } = useQuery({
    queryKey: ['webpage-content', source.link],
    queryFn: async () => {
      const result = await fetchWebpageContent(source.link);
      if (result.error === true) {
        toast.error(t('toasts.error-loading-page'));
      }
      return result;
    },
    staleTime: 10 * 60 * 1000,
  });

  const displayHostname = parseHostname(source.link);
  let displayTitle = '';
  if (isLoading && !source.name) {
    displayTitle = 'Titel wird geladen...';
  } else {
    displayTitle = truncateText(source.name || data?.name || '', 30);
  }

  return (
    <TooltipProvider skipDelayDuration={0} delayDuration={0}>
      <div
        className={cn('flex flex-row  items-center gap-0 p-1', className)}
        style={{
          direction: 'ltr',
        }}
        role="button"
        onClick={() => window.open(source.link, '_blank', 'noopener noreferrer')}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-row items-center gap-1 p-1.5">
              <SearchIcon className="w-3 h-3 ml-1" />
              <span
                className="flex overflow-ellipsis text-xs line-clamp-1"
                aria-label={`Source Title ${index} ${sourceIndex}`}
              >
                {displayTitle} |{' '}
              </span>
              <span
                className="flex-1 overflow-ellipsis text-xs line-clamp-1"
                aria-label={`Source Hostname ${index} ${sourceIndex}`}
              >
                {displayHostname}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent
            asChild
            className={cn(
              'p-2 flex flex-col border-0 bg-white w-60 cursor-pointer text-start citation overflow-hidden',
            )}
          >
            {!source.error && !data?.error && (
              <span
                role="button"
                onClick={() => window.open(source.link, '_blank', 'noopener noreferrer')}
                // overwrite direction from parent
                dir="ltr"
              >
                <span className="font-medium overflow-ellipsis text-sm line-clamp-2">
                  {data?.name}
                </span>
                {data?.content && data.content !== '' && (
                  <span className="text-gray-500 text-sm line-clamp-3 break-words">
                    {data.content.trim()}
                  </span>
                )}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
        {handleDelete !== undefined && (
          <button
            type="button"
            className="text-gray-500 text-sm h-fit"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete?.();
            }}
          >
            <TrashIcon className="w-6 h-6 text-primary hover:fill-text-primary"/>
          </button>
        )}
      </div>
    </TooltipProvider>
  );
}
