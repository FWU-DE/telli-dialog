'use client';

import { cn } from '@/utils/tailwind';
import StopWatchIcon from '@/components/icons/stopwatch';
import React from 'react';
import { useTranslations } from 'next-intl';

type CountDownTimerProps = {
  leftTimeInSeconds: number;
  totalTimeInSeconds: number;
  className?: string;
  stopWatchClassName?: string;
};
export default function CountDownTimer({
  leftTimeInSeconds,
  totalTimeInSeconds,
  className,
  stopWatchClassName,
}: CountDownTimerProps) {
  const t = useTranslations('sharing');
  const [timeRemaining, setTimeRemaining] = React.useState(Math.max(leftTimeInSeconds, 0));

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [leftTimeInSeconds]);

  const textClassName = getColorByLeftAndTotalTime({ leftTimeInSeconds, totalTimeInSeconds });

  return (
    <div
      data-testid="countdown-timer"
      role="timer"
      aria-label={t('countdown-timer-label')}
      className={cn(
        'flex gap-2 items-center min-w-36 px-4 py-2 rounded-xl justify-center',
        className,
        textClassName,
      )}
    >
      <StopWatchIcon className={stopWatchClassName} />
      <span aria-hidden="true">{formatTime(timeRemaining)}</span>
    </div>
  );
}

function formatTime(totalSeconds: number) {
  const days = Math.floor(totalSeconds / (24 * 3600));
  const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else {
    return `${String(minutes).padStart(2, '0')} : ${String(seconds).padStart(2, '0')}`;
  }
}

function getColorByLeftAndTotalTime({
  leftTimeInSeconds,
  totalTimeInSeconds,
}: CountDownTimerProps) {
  const percentage = leftTimeInSeconds / totalTimeInSeconds;

  if (percentage > 0.2) {
    return 'text-[#00594f] bg-[#6CE9D70D]';
  }
  return 'text-dark-red bg-light-red';
}
