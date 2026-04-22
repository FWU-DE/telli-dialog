'use client';

import { useEffect, useRef, useState } from 'react';

export function useElementVisibility<T extends HTMLElement>({ threshold = 0.1 } = {}) {
  const elementRef = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsVisible(entry.isIntersecting);
        }
      },
      { threshold },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return { elementRef, isVisible };
}
