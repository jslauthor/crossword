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
  height = 17,
  color = '#A6CFD4',
  flipped = false,
  className,
}) => {
  return (
    <div className={className}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 12 17"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          transform={flipped ? `scale(-1, 1) translate(-12, 0)` : ''}
          d="M10.9744 5.4096L8.47363 1.46392L8.27058 4.23304C8.27058 4.23304 5.36023 4.25662 4.2774 4.49145C3.19457 4.72629 2.30295 5.12287 1.99562 5.85994C2.5234 7.64278 3.70279 8.28375 3.70279 8.28375C3.70279 8.28375 4.5275 7.48096 7.99137 6.93884L7.8864 9.08462L10.9744 5.4096Z"
          fill={tinycolor(`${color}`).brighten(15).toHexString()}
        />
        <path
          transform={flipped ? `scale(-1, 1) translate(-12, 0)` : ''}
          d="M9.93189 12.3287C7.82742 11.8002 3.95363 11.0657 1.70059 7.33893L2.13111 10.1909C2.13111 10.1909 2.10307 12.101 5.0908 14.1278C7.2507 15.4784 8.67921 16.1215 9.85799 16.3354"
          fill={color}
        />
      </svg>
    </div>
  );
};

export default TurnArrow;
