import { useEffect, useState, useCallback } from 'react';

/**
 * Custom hook for automatically scrolling to the bottom of a container
 * when dependencies change (typically when new messages are added or loading state changes).
 * Only scrolls if the user is currently at or near the bottom of the container.
 *
 * @param dependencies - Array of dependencies that trigger the scroll
 * @returns A callback ref to attach to the scrollable container
 */
export function useAutoScroll(dependencies: React.DependencyList) {
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const checkIfAtBottom = useCallback(() => {
    if (scrollElement) {
      const { scrollTop, scrollHeight, clientHeight } = scrollElement;
      const threshold = 100; // pixels from bottom to consider "at bottom"
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - threshold;
      setIsAtBottom(isNearBottom);
    }
  }, [scrollElement]);

  // Callback ref that handles element attachment/detachment
  const scrollRef = useCallback((element: HTMLDivElement | null) => {
    setScrollElement(element);
  }, []);

  // Set up scroll listener whenever the element changes
  useEffect(() => {
    if (scrollElement) {
      scrollElement.addEventListener('scroll', checkIfAtBottom, { passive: true });
      // Check initial position
      checkIfAtBottom();

      return () => {
        scrollElement.removeEventListener('scroll', checkIfAtBottom);
      };
    }
  }, [scrollElement, checkIfAtBottom]);

  // Auto-scroll when dependencies change, but only if user is at bottom
  useEffect(() => {
    if (scrollElement && isAtBottom) {
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, scrollElement, isAtBottom]);

  return scrollRef;
}
