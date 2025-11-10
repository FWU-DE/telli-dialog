import { useEffect, useRef } from 'react';

/**
 * Custom hook for automatically scrolling to the bottom of a container
 * when dependencies change (typically when new messages are added or loading state changes).
 *
 * @param dependencies - Array of dependencies that trigger the scroll
 * @returns A ref object to attach to the scrollable container
 */
export function useAutoScroll(dependencies: React.DependencyList) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);

  return scrollRef;
}
