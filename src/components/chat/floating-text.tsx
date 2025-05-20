'use client';

import useBreakpoints from '../hooks/use-breakpoints';
import React from 'react';
import MarkdownDisplay from './markdown-display';
import { cn } from '@/utils/tailwind';
import ChevronDownIcon from '../icons/chevron-down';
import ChevronRightIcon from '../icons/chevron-right';

export const dynamic = 'force-dynamic';

// Floating, minimizable, movable learning context dialog (desktop only) on mobile it's sticky on the top
export function FloatingText({
  learningContext,
  dialogStarted,
  title,
  parentRef,
  maxWidth,
  maxHeight,
  initialMargin,
  minMargin,
}: {
  learningContext: string;
  dialogStarted: boolean;
  title: string;
  parentRef: React.RefObject<HTMLDivElement>;
  maxWidth: number;
  maxHeight: number;
  initialMargin: number;
  minMargin: number;
}) {
  const { isAtLeast } = useBreakpoints();
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [dragging, setDragging] = React.useState(false);
  const [rel, setRel] = React.useState<{ x: number; y: number } | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Helper to clamp position within parent bounds
  function clampPosition({
    x,
    y,
    containerWidth,
    containerHeight,
  }: {
    x: number;
    y: number;
    containerWidth: number;
    containerHeight: number;
  }) {
    if (!parentRef.current) return { x, y };
    const parentRect = parentRef.current.getBoundingClientRect();
    const newX = Math.max(
      parentRect.x + minMargin,
      Math.min(x, parentRect.width + parentRect.x - containerWidth - minMargin),
    );
    const newY = Math.max(
      parentRect.y + minMargin,
      Math.min(y, parentRect.height + parentRect.y - containerHeight - minMargin),
    );
    return { x: newX, y: newY };
  }

  React.useEffect(() => {
    // Set initial position within parent
    if (parentRef.current && containerRef.current) {
      const parentRect = parentRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      setPosition({
        x: parentRect.width + parentRect.x - (containerRect?.width ?? maxWidth) - initialMargin,
        y: parentRect.height + parentRect.y - (containerRect?.height ?? maxHeight) - initialMargin,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentRef.current]);

  React.useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging || !rel) return;
      if (!containerRef.current || !parentRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      const newX = e.clientX - rel.x;
      const newY = e.clientY - rel.y;

      // Clamp values within parent
      const clamped = clampPosition({ x: newX, y: newY, containerWidth, containerHeight });
      setPosition(clamped);
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
      if (!touch?.clientX || !touch?.clientY) return;
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      const newX = touch.clientX - rel.x;
      const newY = touch.clientY - rel.y;

      // Clamp values within parent
      const clamped = clampPosition({ x: newX, y: newY, containerWidth, containerHeight });
      setPosition(clamped);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        // using string interpolations is extremly flaky, so we're using a static class name
        isAtLeast.lg ? `absolute` : 'sticky',
        dragging ? 'cursor-grabbing' : 'cursor-grab',
      )}
      style={{
        left: position.x,
        top: isAtLeast.lg ? position.y : 0,
        maxWidth: isAtLeast.lg ? maxWidth : '100%',
        maxHeight: isAtLeast.lg ? maxHeight : '40%',
      }}
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
                const parentRect = parentRef.current.getBoundingClientRect();
                const rect = containerRef.current.getBoundingClientRect();
                const newPos = {
                  x: Math.max(
                    0,
                    Math.min(position.x, parentRect.width + parentRect.x - rect.width - minMargin),
                  ),
                  y: Math.max(
                    0,
                    Math.min(
                      position.y,
                      parentRect.height + parentRect.y - rect.height - minMargin,
                    ),
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
