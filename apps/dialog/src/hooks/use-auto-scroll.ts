import { useEffect, useRef } from 'react';

/**
 * Custom hook for automatically scrolling to the bottom of a container
 * when dependencies change (typically when new messages are added)
 *
 * @param dependencies - Array of dependencies that trigger the scroll
 * @param behavior - Scroll behavior ('smooth' | 'auto' | 'instant')
 * @returns A ref object to attach to the scrollable container
 */
export function useAutoScroll<T extends HTMLElement = HTMLDivElement>(
  dependencies: React.DependencyList,
  behavior: ScrollBehavior = 'smooth',
) {
  const scrollRef = useRef<T | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, behavior]);

  return scrollRef;
}
