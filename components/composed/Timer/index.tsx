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

const formatTime = (elapsedTime: number) =>
  (elapsedTime ?? 0) < 3600
    ? new Date((elapsedTime ?? 0) * 1000).toISOString().slice(14, 19)
    : new Date((elapsedTime ?? 0) * 1000).toISOString().slice(11, 19);

export default Timer;
