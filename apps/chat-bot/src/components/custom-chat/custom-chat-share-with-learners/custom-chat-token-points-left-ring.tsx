'use client';

import { cn } from '@/utils/tailwind';

type TokenPointsLeftRingProps = {
  tokenLimit: number;
  spentTokens: number;
  spentLabel: string;
  ariaLabel: string;
  className?: string;
  minimumVisiblePercentage?: number;
};

const RING_SIZE = 96;
const STROKE_WIDTH = 14;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function TokenPointsLeftRing({
  tokenLimit,
  spentTokens,
  spentLabel,
  ariaLabel,
  className,
  minimumVisiblePercentage = 3,
}: TokenPointsLeftRingProps) {
  const remainingPercentageRaw =
    Number.isFinite(spentTokens) && spentTokens >= 0
      ? ((tokenLimit - spentTokens) / tokenLimit) * 100
      : 0;
  const isSpent = remainingPercentageRaw <= 0;
  const remainingPercentage = clamp(remainingPercentageRaw, 0, 100);
  const visualPercentage = Math.max(clamp(remainingPercentage, 0, 100), minimumVisiblePercentage);
  const isLow = remainingPercentage <= 20;

  const progressColor = isLow ? 'var(--dark-red)' : 'var(--dark-green)';
  const strokeDashoffset = CIRCUMFERENCE - (visualPercentage / 100) * CIRCUMFERENCE;

  return isSpent ? (
    <span className="flex flex-col items-center font-medium text-dark-red">{spentLabel}</span>
  ) : (
    <div className="flex flex-col items-center gap-1" data-testid="token-points-left-ring">
      <div
        className={cn('relative size-24 shrink-0', className)}
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(isSpent ? 0 : remainingPercentage)}
        aria-valuetext={isSpent ? spentLabel : `${Math.round(remainingPercentage)} %`}
      >
        <svg
          viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
          className="size-full -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--dark-gray)"
            opacity={0.3}
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            cx={RING_SIZE / 2}
            cy={RING_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={progressColor}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-500 ease-in-out"
          />
        </svg>
      </div>
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
