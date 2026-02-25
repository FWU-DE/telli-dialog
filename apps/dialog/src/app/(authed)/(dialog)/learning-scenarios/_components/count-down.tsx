'use client';

import { cn } from '@/utils/tailwind';
import StopWatchIcon from '@/components/icons/stopwatch';
import React from 'react';

type CountDownTimerProps = {
  leftTime: number;
  totalTime: number;
  className?: string;
  stopWatchClassName?: string;
};
export default function CountDownTimer({
  leftTime,
  totalTime,
  className,
  stopWatchClassName,
}: CountDownTimerProps) {
  const [timeRemaining, setTimeRemaining] = React.useState(leftTime);

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
  }, [leftTime]);

  const textClassName = getColorByLeftAndTotalTime({ leftTime, totalTime });

  return (
    <div
      id="countdown-timer"
      className={cn(
        'flex gap-2 items-center min-w-36 px-4 py-2 rounded-xl justify-center',
        className,
        textClassName,
      )}
    >
      <StopWatchIcon className={stopWatchClassName} />
      <span>{formatTime(timeRemaining)}</span>
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

function getColorByLeftAndTotalTime({ leftTime, totalTime }: CountDownTimerProps) {
  const percentage = leftTime / totalTime;

  if (percentage > 0.2) {
    return 'text-[#00594f] bg-[#6CE9D70D]';
  }
  return 'text-dark-red bg-light-red';
}
