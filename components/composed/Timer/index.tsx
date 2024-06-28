import React, { useMemo } from 'react';
import { Badge } from 'components/core/ui/badge';
import { cva } from 'class-variance-authority';
import { cn } from 'lib/utils';
import { Clock10 } from 'lucide-react';
import styled from 'styled-components';
import { formatTime } from 'lib/utils/date';

const Clock = styled(Clock10)`
  margin-top: 0.05rem;
`;

interface TimerProps {
  elapsedTime: number;
  size?: 'large' | 'default';
}

const clockVariants = cva('mr-0.5 text-primary', {
  variants: {
    size: {
      default: 'h-2.5 w-2.5',
      large: 'h-4 w-4 mr-1',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

const Timer: React.FC<TimerProps> = ({ elapsedTime, size = 'default' }) => {
  const formattedTime = useMemo(() => formatTime(elapsedTime), [elapsedTime]);

  return (
    <Badge variant="secondary" size={size}>
      <Clock className={cn(clockVariants({ size }))} />
      {formattedTime}
    </Badge>
  );
};

export default Timer;
