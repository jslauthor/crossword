import React, { useMemo } from 'react';
import { Badge } from 'components/core/ui/badge';
import { formatTime } from 'lib/utils/date';
import Image from 'next/image';

interface Props {
  elapsedTime: number;
  guesses?: number;
  size?: 'large' | 'default';
}

const TimerAndGuesses: React.FC<Props> = ({
  elapsedTime,
  guesses,
  size = 'default',
}) => {
  const formattedTime = useMemo(() => formatTime(elapsedTime), [elapsedTime]);

  return (
    <Badge variant="secondary" size={size}>
      {guesses != null && guesses > 0 && (
        <div className="flex flex-row items-center mr-2 max-w-11">
          <Image
            src="/noto/svg/emoji_u1f7e6.svg"
            alt="blue square"
            width={10}
            height={10}
            className="mr-1"
          />
          <span className="truncate">{guesses}</span>
        </div>
      )}
      <div className="flex flex-row items-center">
        <Image
          src="/noto/svg/emoji_u23f1.svg"
          alt="clock"
          width={10}
          height={10}
          className="mr-1"
        />
        <div>{formattedTime}</div>
      </div>
    </Badge>
  );
};

export default TimerAndGuesses;
