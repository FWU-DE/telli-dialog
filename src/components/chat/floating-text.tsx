"use client";

import useBreakpoints from '../hooks/use-breakpoints';
import React from 'react';
import MarkdownDisplay from './markdown-display';
import { cn } from '@/utils/tailwind';
import ChevronDownIcon from '../icons/chevron-down';
import ChevronLeftIcon from '../icons/chevron-left';

export const dynamic = 'force-dynamic';

const MAX_WIDTH = 420;
const MAX_HEIGHT = 300;
const INITIAL_MARGIN = 32;

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
  const [show, setShow] = React.useState(true);
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

  console.log(parentRef.current?.getBoundingClientRect());

  React.useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!dragging || !rel) return;
      if (!containerRef.current || !parentRef.current) return;

      const parentRect = parentRef.current.getBoundingClientRect();
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      let newX = e.clientX - rel.x ;
      let newY = e.clientY - rel.y ;

      // Clamp values within parent
      newX = Math.max(parentRect.x, Math.min(newX, parentRect.width + parentRect.x - containerWidth));
      newY = Math.max(parentRect.y, Math.min(newY, parentRect.height + parentRect.y - containerHeight));

      setPosition({
        x: newX,
        y: newY,
      });
    }
    function onMouseUp() {
      setDragging(false);
      setRel(null);
    }
    if (dragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, rel, parentRef]);

  function handleMouseDown(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDragging(true);
      setRel({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }

  if (!isAtLeast.md || !show || !dialogStarted) return null;

  if (isMinimized) {
    return (
      <div
        ref={containerRef}
        className={cn(
          "absolute z-50 bg-vidis-hover-green/40 shadow-lg rounded-xl border border-gray-200 select-none flex items-center px-4 py-2",
          `max-w-[420px]`
        )}
        style={{ left: position.x, top: position.y }}
        title={title}
        onMouseDown={handleMouseDown}
        >
        <span className="font-semibold text-base cursor-grab ">{title}</span>
        <ChevronDownIcon className="ml-2 cursor-pointer w-5 h-5"  
          onClick={() => {
            setIsMinimized(false);
            setTimeout(() => {
              if (containerRef.current && parentRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                const parentRect = parentRef.current.getBoundingClientRect();
                const newPos = {
                  x: Math.max(0, Math.min(position.x, parentRect.width - rect.width)),
                  y: Math.max(0, Math.min(position.y, parentRect.height - rect.height)),
                };
                if (newPos.x !== position.x || newPos.y !== position.y) {
                  setPosition(newPos);
                }
              }
            }, 0);
          }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute z-50 bg-vidis-user-chat-background rounded-xl border border-gray-200 select-none",
        `max-w-[${MAX_WIDTH}px]`,
        `min-w-[${MAX_WIDTH}px]`,
        `max-h-[${MAX_HEIGHT}px]`,
        dragging ? "cursor-grabbing" : "cursor-grab"
      )}
      style={{ left: position.x, top: position.y }}
    >
      <div
        className="flex items-center justify-between px-4 py-2 border-b border-gray-200 rounded-t-xl"
        onMouseDown={handleMouseDown}
      >
        <span className="font-semibold text-base">{title}</span>
        <button
          aria-label="Minimize"
          onClick={() => setIsMinimized(true)}
          className="bg-none border-none cursor-pointer p-0"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
      </div>
      <div className={cn(
        "p-4 overflow-y-auto",
      )}
      >
        <MarkdownDisplay>{learningContext ?? ''}</MarkdownDisplay>
      </div>
    </div>
  );
}
