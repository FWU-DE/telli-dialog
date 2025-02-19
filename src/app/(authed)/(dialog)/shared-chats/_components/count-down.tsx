'use client';

import { cn } from '@/utils/tailwind';
import StopWatchIcon from '@/components/icons/stopwatch';
import React from 'react';

type CountDownTimerProps = {
  leftTime: number;
  totalTime: number;
  className?: string;
};
export default function CountDownTimer({ leftTime, totalTime, className }: CountDownTimerProps) {
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
    <div className={cn('flex gap-2 items-center min-w-[5rem] p-2', className, textClassName)}>
      <StopWatchIcon />
      <span>{formatTime(timeRemaining)}</span>
    </div>
  );
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, '0')} : ${String(remainingSeconds).padStart(2, '0')}`;
}

function getColorByLeftAndTotalTime({ leftTime, totalTime }: CountDownTimerProps) {
  const percentage = leftTime / totalTime;

  if (percentage > 0.3) {
    return 'text-[#02A59B] bg-vidis-hover-green/20';
  }
  if (percentage > 0.1) {
    return 'text-[rgba(254,229,133,1)] bg-[rgba(254,229,133,0.1)]';
  }
  return 'text-[rgba(233,77,82,1)] bg-[rgba(233,77,82,0.1)]';
}
