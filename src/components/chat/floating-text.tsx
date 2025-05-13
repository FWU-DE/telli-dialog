'use client';

import useBreakpoints from '../hooks/use-breakpoints';
import React from 'react';
import MarkdownDisplay from './markdown-display';
import { cn } from '@/utils/tailwind';
import ChevronDownIcon from '../icons/chevron-down';
import ChevronRightIcon from '../icons/chevron-right';

export const dynamic = 'force-dynamic';

const MAX_WIDTH = 400;
const MAX_HEIGHT = 450;
const INITIAL_MARGIN = 32;
const MIN_MARGIN = 16;
// Floating, minimizable, movable learning context dialog (desktop only)
export function FloatingText({
  learningContext,
  dialogStarted,
  title,
  parentRef,
}: {
  learningContext: string;
  dialogStarted: boolean;
  title: string;
  parentRef: React.RefObject<HTMLDivElement>;
}) {
  const { isAtLeast } = useBreakpoints();
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const [rel, setRel] = React.useState<{ x: number; y: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Set initial position within parent
    if (parentRef.current) {
      const parentRect = parentRef.current.getBoundingClientRect();
      // move to the bottom right of the parent
      setPosition({
        x: parentRect.width + parentRect.x - MAX_WIDTH - INITIAL_MARGIN,
        y: parentRect.height + parentRect.y - MAX_HEIGHT - INITIAL_MARGIN,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentRef.current]);

  React.useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging || !rel) return;
      if (!containerRef.current || !parentRef.current) return;

      const parentRect = parentRef.current.getBoundingClientRect();
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      let newX = e.clientX - rel.x;
      let newY = e.clientY - rel.y;

      // Clamp values within parent
      newX = Math.max(
        parentRect.x + MIN_MARGIN,
        Math.min(newX, parentRect.width + parentRect.x - containerWidth) - MIN_MARGIN,
      );
      newY = Math.max(
        parentRect.y + MIN_MARGIN,
        Math.min(newY, parentRect.height + parentRect.y - containerHeight) - MIN_MARGIN,
      );

      setPosition({
        x: newX,
        y: newY,
      });
    }
    function onMouseUp() {
      setDragging(false);
      setRel(null);
    }
    // Touch event handlers
    function onTouchMove(e: TouchEvent) {
      if (!dragging || !rel) return;
      if (!containerRef.current || !parentRef.current) return;
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const parentRect = parentRef.current.getBoundingClientRect();
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = MAX_WIDTH;
      const containerHeight = containerRect.height;

      let newX = touch?.clientX ?? 0 - rel.x;
      let newY = touch?.clientY ?? 0 - rel.y;

      // Clamp values within parent
      newX = Math.max(
        parentRect.x,
        Math.min(newX, parentRect.width + parentRect.x - containerWidth),
      );
      newY = Math.max(
        parentRect.y,
        Math.min(newY, parentRect.height + parentRect.y - containerHeight),
      );

      setPosition({
        x: newX,
        y: newY,
      });
    }
    function onTouchEnd() {
      setDragging(false);
      setRel(null);
    }
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('touchmove', onTouchMove);
      window.addEventListener('touchend', onTouchEnd);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [dragging, rel, parentRef]);

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragging(true);
      setRel({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }

  // Touch start handler
  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    if (containerRef.current && e.touches.length === 1) {
      const rect = containerRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      if (!touch) return;
      setDragging(true);
      setRel({ x: touch.clientX - rect.left, y: touch.clientY - rect.top });
    }
  }

  if (!dialogStarted) return null;

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col z-50 bg-vidis-user-chat-background rounded-xl border select-none',
        `max-h-[${MAX_HEIGHT}px]`,
        isAtLeast.lg ? `absolute` : 'sticky',
        // This is broken up on purpose, tailwind does not support dynamic class names like 'absolute w-[420px]'
        isAtLeast.lg ? `max-w-[${MAX_WIDTH}px]` : 'w-[100%]',
        dragging ? 'cursor-grabbing' : 'cursor-grab',
      )}
      style={{ left: position.x, top: isAtLeast.lg ? position.y : 0 }}
    >
      <div
        className="flex items-center justify-between pl-4 py-2 rounded-t-xl mr-1"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <span
          className={cn(dragging ? 'cursor-grabbing' : 'cursor-grab', 'font-semibold text-base')}
        >
          {title}
        </span>
        <button
          aria-label="Minimize"
          onClick={() => {
            setIsMinimized(!isMinimized);
            setTimeout(() => {
              if (containerRef.current && parentRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const parentRect = parentRef.current.getBoundingClientRect();
                const newPos = {
                  x: Math.max(
                    0,
                    Math.min(position.x, parentRect.width + parentRect.x - rect.width),
                  ),
                  y: Math.max(
                    0,
                    Math.min(position.y, parentRect.height + parentRect.y - rect.height),
                  ),
                };
                if (newPos.x !== position.x || newPos.y !== position.y) {
                  setPosition(newPos);
                }
              }
            }, 0);
          }}
          className="flex items-center justify-center bg-none border-none cursor-pointer w-6 h-6"
        >
          {isMinimized ? <ChevronRightIcon /> : <ChevronDownIcon />}
        </button>
      </div>
      {!isMinimized && (
        <div className="flex-1 ml-2 p-2 cursor-text select-text overflow-auto">
          <MarkdownDisplay>{learningContext ?? ''}</MarkdownDisplay>
        </div>
      )}
    </div>
  );
}
