'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

type WebpageCardProps = {
  url: string;
};

async function fetchWebpageMetadata(url: string) {
  const response = await fetch(`/api/webpage-metadata?url=${encodeURIComponent(url)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch webpage metadata');
  }
  return response.json();
}

export function WebpageCard({ url }: WebpageCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { data } = useQuery({
    queryKey: ['webpageMetadata', url],
    queryFn: () => fetchWebpageMetadata(url),
  });

  const title = data?.title || 'Untitled Page';

  return (
    <div className="relative h-full w-full">
      <div
        className="inline-block p-2 rounded-lg bg-secondary/10 hover:bg-secondary/20"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          <a
            className="text-sm text-primary truncate max-w-[200px]"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {title}
          </a>
        </div>
      </div>
      {isHovered && (
        <div className="absolute z-50 bg-red-500 rounded-lg shadow-lg border border-gray-200">
          <div className="p-4">
            <h3 className="text-lg font-medium text-primary mb-2">{title}</h3>
          </div>
        </div>
      )}
    </div>
  );
}
