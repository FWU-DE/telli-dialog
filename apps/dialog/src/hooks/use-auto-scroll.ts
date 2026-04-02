import { useCallback, useEffect, useState } from 'react';

/**
 * Custom hook for automatically scrolling to the bottom of a container
 * when dependencies change (typically when new messages are added or loading state changes).
 * Automatic scrolling can be disabled if the user manually scrolls away.
 * To reactivate auto-scrolling (e.g., after sending a message), call the reactivateAutoScrolling function returned by the hook.
 *
 * NOTE
 * The hook only listens to mouse wheel and touch events to determine if the user has manually scrolled away.
 * Grabbing the scrollbar or using keyboard navigation won't disable auto-scrolling.
 * Using the 'scroll' event didn't work reliably because the auto scroll itself also triggers scroll events.
 * Depending on the rendering performance the auto scroll gets deactivated without any user interaction or
 * the user cannot interrupt auto scrolling because rendering is too fast.
 *
 * @param dependencies - Array of dependencies that trigger the scroll
 * @returns Object with scrollRef (callback ref to attach to the scrollable container),
 *          reactivateAutoScrolling to re-enable auto-scroll
 */
export function useAutoScroll(dependencies: React.DependencyList) {
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const [isAutoScrollEnabled, setAutoScrollEnabled] = useState(true);

  // Callback ref that handles element attachment/detachment
  const scrollRef = useCallback((element: HTMLDivElement | null) => {
    setScrollElement(element);
  }, []);

  const reactivateAutoScrolling = useCallback(() => {
    if (scrollElement) {
      setAutoScrollEnabled(true);
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [scrollElement]);

  // Detect user scroll intent via wheel or touch events
  useEffect(() => {
    if (!scrollElement) return;

    const handleWheel = () => {
      setAutoScrollEnabled(false);
    };

    const handleTouch = () => {
      setAutoScrollEnabled(false);
    };

    scrollElement.addEventListener('wheel', handleWheel, { passive: true });
    scrollElement.addEventListener('touchstart', handleTouch, { passive: true });
    scrollElement.addEventListener('touchend', handleTouch, { passive: true });

    return () => {
      scrollElement.removeEventListener('wheel', handleWheel);
      scrollElement.removeEventListener('touchstart', handleTouch);
      scrollElement.removeEventListener('touchend', handleTouch);
    };
  }, [scrollElement]);

  // Auto-scroll to bottom when dependencies change
  useEffect(() => {
    if (scrollElement && isAutoScrollEnabled) {
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, scrollElement, isAutoScrollEnabled]);

  return { scrollRef, reactivateAutoScrolling };
}
