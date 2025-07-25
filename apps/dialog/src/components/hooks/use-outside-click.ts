import React from 'react';

export function useOutsideClick<E extends HTMLElement>(callback: () => void) {
  const ref = React.useRef<E>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('click', handleClickOutside, { capture: true });
    return () => {
      document.removeEventListener('click', handleClickOutside, { capture: true });
    };
  }, [callback]);

  return ref;
}
