import { useEffect, useRef, useState, useCallback } from 'react';

const STORAGE_KEY_AUTO_SCROLL_PAUSED = 'preserve-scroll-auto-scroll-paused';
const STORAGE_KEY_SCROLL_POSITION = 'preserve-scroll-position';

/** Check whether a scroll container is near the bottom (within threshold). */
function isNearBottom(element: HTMLElement, threshold = 20): boolean {
  const { scrollTop, clientHeight, scrollHeight } = element;
  return scrollTop + clientHeight >= scrollHeight - threshold;
}

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
 *          reactivateAutoScrolling to re-enable auto-scroll,
 *          and preserveScrollState to save scroll position before a remount
 */
export function useAutoScroll(dependencies: React.DependencyList) {
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const [isAutoScrollEnabled, setAutoScrollEnabled] = useState(() => {
    // On initial load, check if auto-scroll was previously paused and restore that state
    if (typeof window !== 'undefined') {
      const preserved = sessionStorage.getItem(STORAGE_KEY_AUTO_SCROLL_PAUSED);
      if (preserved) {
        sessionStorage.removeItem(STORAGE_KEY_AUTO_SCROLL_PAUSED);
        return false;
      }
    }
    return true;
  });

  // Callback ref that handles element attachment/detachment
  // and restores saved scroll position on remount
  const scrollRef = useCallback((element: HTMLDivElement | null) => {
    setScrollElement(element);
    if (element && typeof window !== 'undefined') {
      const savedPosition = sessionStorage.getItem(STORAGE_KEY_SCROLL_POSITION);
      if (savedPosition) {
        sessionStorage.removeItem(STORAGE_KEY_SCROLL_POSITION);
        const scrollTop = parseInt(savedPosition, 10);
        requestAnimationFrame(() => {
          element.scrollTo({ top: scrollTop, behavior: 'instant' });
        });
      }
    }
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

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY < 0) {
        setAutoScrollEnabled(false);
      } else if (isNearBottom(scrollElement)) {
        setAutoScrollEnabled(true);
      }
    };

    const handleTouch = () => {
      setAutoScrollEnabled(isNearBottom(scrollElement));
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

  // Ref keeps the latest values accessible from the preserveScrollState callback
  const scrollStateRef = useRef({ isAutoScrollEnabled, scrollElement });
  scrollStateRef.current = { isAutoScrollEnabled, scrollElement };

  // Save current scroll position to sessionStorage so it survives a remount
  const preserveScrollState = useCallback(() => {
    if (typeof window === 'undefined') return;
    const { isAutoScrollEnabled: enabled, scrollElement: el } = scrollStateRef.current;
    if (!enabled) {
      sessionStorage.setItem(STORAGE_KEY_AUTO_SCROLL_PAUSED, '1');
      if (el) {
        sessionStorage.setItem(STORAGE_KEY_SCROLL_POSITION, String(el.scrollTop));
      }
    }
  }, []);

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

  return { scrollRef, reactivateAutoScrolling, preserveScrollState };
}
