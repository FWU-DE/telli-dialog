'use client';
import './citation.css';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/utils/tailwind';
import SearchIcon from '@/components/icons/search';
import { getDisplayUrl } from '@/utils/web-search/parsing';
import TrashIcon from '@/components/icons/trash';
import { WebsearchSource } from '@shared/db/types';

function truncateText(text: string, maxLength: number) {
  return text.length > maxLength ? text.slice(0, maxLength) + '...' : text;
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
  const displayTitle = truncateText(getDisplayUrl(source.link), 30);

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
                onClick={() => window.open(source.link, '_blank', 'noopener noreferrer')}
                // overwrite direction from parent
                dir="ltr"
              >
                <span className="font-medium overflow-ellipsis text-sm line-clamp-2">
                  {getDisplayUrl(source.link)}
                </span>
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
            <TrashIcon className="w-6 h-6 text-primary" fillOnHover />
          </button>
        )}
      </div>
    </TooltipProvider>
  );
}
