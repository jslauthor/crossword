import React, { useMemo } from 'react';
import { Badge } from 'components/core/ui/badge';
import Clock from 'components/svg/Clock';

interface TimerProps {
  elapsedTime: number;
}

const Timer: React.FC<TimerProps> = ({ elapsedTime }) => {
  const formattedTime = useMemo(() => formatTime(elapsedTime), [elapsedTime]);

  return (
    <Badge variant="secondary">
      <Clock className="h-4 w-4 text-primary" />
      {formattedTime}
    </Badge>
  );
};

function formatTime(elapsedTime: number | null): string {
  const seconds = Math.floor((elapsedTime ?? 0) % 60);
  const minutes = Math.floor(((elapsedTime ?? 0) / 60) % 60);
  const hours = Math.floor((elapsedTime ?? 0) / 3600);

  const padZero = (num: number): string => num.toString().padStart(2, '0');

  if (hours > 0) {
    return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
  } else {
    return `${padZero(minutes)}:${padZero(seconds)}`;
  }
}

export default Timer;
