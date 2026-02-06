import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Custom hook for automatically scrolling to the bottom of a container
 * when dependencies change (typically when new messages are added or loading state changes).
 * Only scrolls if the user is currently at or near the bottom of the container.
 *
 * @param dependencies - Array of dependencies that trigger the scroll
 * @returns A ref object to attach to the scrollable container
 */
export function useAutoScroll(dependencies: React.DependencyList) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const checkIfAtBottom = useCallback(() => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const threshold = 100; // pixels from bottom to consider "at bottom"
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;
      setIsAtBottom(isNearBottom);
    }
  }, []);

  // Set up scroll listener
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkIfAtBottom, { passive: true });
      // Check initial position
      checkIfAtBottom();

      return () => {
        scrollElement.removeEventListener('scroll', checkIfAtBottom);
      };
    }
  }, [checkIfAtBottom]);

  // Auto-scroll when dependencies change, but only if user is at bottom
  useEffect(() => {
    if (scrollRef.current && isAtBottom) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]);

  return scrollRef;
}
