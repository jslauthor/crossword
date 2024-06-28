'use client';

import React, { FunctionComponent } from 'react';

interface SpeechBubbleTailProps {
  fill?: string;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

const SpeechBubbleTail: FunctionComponent<SpeechBubbleTailProps> = ({
  fill = 'currentColor',
  width = 16,
  height = 17,
  className,
}) => {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 16 17"
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill={fill}
        d="M11 10.5C11.5014 13.5086 14.3333 16.3333 16 17C9.6 17 6 15 4.5 13.5C3 12 0.6 9.2 0 0H10.5V2V4V4.5C10.5 5.5 10.5 7.5 11 10.5Z"
      />
    </svg>
  );
};

export default SpeechBubbleTail;
