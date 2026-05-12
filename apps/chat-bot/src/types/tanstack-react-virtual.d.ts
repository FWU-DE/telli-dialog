declare module '@tanstack/react-virtual' {
  export interface VirtualItem {
    index: number;
    start: number;
  }

  export interface Virtualizer {
    getTotalSize(): number;
    getVirtualItems(): VirtualItem[];
  }

  export interface UseVirtualizerOptions {
    count: number;
    getScrollElement: () => Element | Window | null;
    estimateSize: () => number;
    overscan?: number;
    scrollMargin?: number;
  }

  export function useVirtualizer(options: UseVirtualizerOptions): Virtualizer;
}
