import { useEffect, useState, useCallback } from 'react';

/**
 * Custom hook for automatically scrolling to the bottom of a container
 * when dependencies change (typically when new messages are added or loading state changes).
 * Automatic scrolling can be disabled if the user manually scrolls away.
 * To reactivate auto-scrolling (e.g., after sending a message), call the reactivateAutoScrolling function returned by the hook.
 *
 * @param dependencies - Array of dependencies that trigger the scroll
 * @returns Object with scrollRef (callback ref to attach to the scrollable container) and reactivateAutoScrolling function
 */
export function useAutoScroll(dependencies: React.DependencyList) {
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const [isAutoScrollEnabled, setAutoScrollEnabled] = useState(true);

  // Callback ref that handles element attachment/detachment
  const scrollRef = useCallback((element: HTMLDivElement | null) => {
    setScrollElement(element);
  }, []);

  // Function to reactivate auto-scrolling and scroll to the end
  const reactivateAutoScrolling = useCallback(() => {
    if (scrollElement) {
      setAutoScrollEnabled(true);
      requestAnimationFrame(() => {
        if (scrollElement) {
          scrollElement.scrollTo({
            top: scrollElement.scrollHeight,
            behavior: 'smooth',
          });
        }
      });
    }
  }, [scrollElement]);

  // Set up scroll and touch listeners whenever the element changes
  useEffect(() => {
    if (scrollElement) {
      // Handle wheel events (mouse wheel scrolling) - clear indicator of user intent
      const handleWheel = () => {
        setAutoScrollEnabled(false);
      };
      scrollElement.addEventListener('wheel', handleWheel, { passive: true });

      // Handle touch events to catch cases where users touch to stop momentum scrolling
      const handleTouchStart = () => {
        setAutoScrollEnabled(false);
      };

      scrollElement.addEventListener('touchstart', handleTouchStart, { passive: true });
      scrollElement.addEventListener('touchend', handleTouchStart, { passive: true });

      return () => {
        scrollElement.removeEventListener('wheel', handleWheel);
        scrollElement.removeEventListener('touchstart', handleTouchStart);
        scrollElement.removeEventListener('touchend', handleTouchStart);
      };
    }
  }, [scrollElement]);

  // Auto-scroll when dependencies change, but only if user hasn't manually scrolled away
  useEffect(() => {
    if (scrollElement && isAutoScrollEnabled) {
      // Use requestAnimationFrame to ensure DOM updates are complete
      // This prevents issues on fast systems where scrollHeight might not be updated yet
      requestAnimationFrame(() => {
        if (scrollElement && isAutoScrollEnabled) {
          scrollElement.scrollTo({
            top: scrollElement.scrollHeight,
            behavior: 'smooth',
          });
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, scrollElement, isAutoScrollEnabled]);

  return { scrollRef, reactivateAutoScrolling };
}
