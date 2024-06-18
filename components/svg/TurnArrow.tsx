'use client';

import React, { FunctionComponent } from 'react';
import tinycolor from 'tinycolor2';

interface TurnArrowProps {
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  flipped?: boolean;
}

const TurnArrow: FunctionComponent<TurnArrowProps> = ({
  width = 12,
  height = 12,
  color = '#A6CFD4',
  flipped = false,
  className,
}) => {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        transform={flipped ? `scale(-1, 1) translate(-12, 0)` : ''}
        d="M5.91095 2.32753C5.91095 2.32753 5.23016 2.61674 4.30555 2.97455C3.38094 3.33236 2.0848 4.33086 2.0848 4.33086C2.0848 4.33086 1.22035 4.09231 0.609222 3.01994C0.698939 2.49852 1.22035 2.11116 1.89059 1.79768C2.56083 1.4842 3.55404 1.2256 3.87386 1.14961C4.93885 0.896288 5.80118 0.816071 5.80118 0.816071L5.91095 2.32753Z"
        fill={tinycolor(`${color}`).darken(25).desaturate(50).toHexString()}
      />
      <path
        transform={flipped ? `scale(-1, 1) translate(-12, 0)` : ''}
        d="M8.28475 9.74023C6.96961 9.76873 5.66186 9.56186 4.05329 9.00983C1.80298 8.14539 1.53489 6.90835 1.53489 6.90835L0.639832 4.33084C2.66637 6.40171 6.96856 6.23917 8.41775 6.26767L8.4473 4.45011L11.3235 7.83296L8.25414 11.1704L8.2837 9.74023H8.28475Z"
        fill={tinycolor(`${color}`).darken(5).toHexString()}
      />
    </svg>
  );
};

export default TurnArrow;
