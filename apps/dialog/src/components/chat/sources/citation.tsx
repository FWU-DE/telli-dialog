'use client';
import './citation.css';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils/tailwind';
import SearchIcon from '@/components/icons/search';
import { getDisplayUrl } from '@/utils/web-search/parsing';
import { openInNewTab } from '@/utils/navigation/router';
import TrashIcon from '@/components/icons/trash';
import Spinner from '@/components/icons/spinner';
import { WebsearchSource } from '@shared/db/types';

function truncateText(text: string, maxLength: number) {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
}

export default function Citation({
  source,
  handleDelete,
  className,
  isLoading = false,
}: {
  source: WebsearchSource;
  handleDelete?: () => void;
  className?: string;
  isLoading?: boolean;
}) {
  const displayUrl = getDisplayUrl(source.link);
  const displayTitle = truncateText(displayUrl, 30);

  return (
    <TooltipProvider skipDelayDuration={0} delayDuration={0}>
      <div
        className={cn(
          'flex flex-row items-center gap-0 p-1 bg-secondary/50 rounded-enterprise-sm',
          className,
        )}
        style={{
          direction: 'ltr',
        }}
        role="button"
        tabIndex={0}
        onClick={() => openInNewTab(source.link)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openInNewTab(source.link);
          }
        }}
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex flex-row items-center gap-1 p-1.5" data-testid="citation">
              <SearchIcon className="w-3 h-3 ml-1" />
              <span className="flex text-ellipsis text-xs line-clamp-1" aria-label={displayUrl}>
                {displayTitle}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent
            asChild
            className={cn(
              'p-2 flex flex-col border-0 bg-white w-60 cursor-pointer text-start citation overflow-hidden',
            )}
          >
            {!source.error && (
              <span
                role="button"
                aria-hidden="true"
                onClick={() => openInNewTab(source.link)}
                // overwrite direction from parent
                dir="ltr"
              >
                <span className="font-medium text-ellipsis text-sm line-clamp-2">{displayUrl}</span>
              </span>
            )}
          </TooltipContent>
        </Tooltip>
        {isLoading && (
          <div className="p-1">
            <Spinner className="size-4" />
          </div>
        )}
        {!isLoading && handleDelete !== undefined && (
          <button
            type="button"
            className="text-gray-500 text-sm h-fit"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete?.();
            }}
          >
            <TrashIcon className="w-6 h-6 text-primary" fillOnHover />
          </button>
        )}
      </div>
    </TooltipProvider>
  );
}
