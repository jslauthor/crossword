import React from 'react';

interface RadarProgressProps {
  progress: number; // 0 to 1
  size?: number;
  color?: string;
}

const RadarProgress: React.FC<RadarProgressProps> = ({
  progress,
  size = 100,
  color = 'currentColor',
}) => {
  const radius = size / 2;
  const normalizedProgress = Math.min(1, Math.max(0, progress));
  const angle = (1 - normalizedProgress) * 360; // Invert progress

  const createArc = (startAngle: number, endAngle: number): string => {
    const start = polarToCartesian(radius, radius, radius, -startAngle);
    const end = polarToCartesian(radius, radius, radius, -endAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

    return [
      'M',
      radius,
      radius,
      'L',
      start.x,
      start.y,
      'A',
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      'Z',
    ].join(' ');
  };

  const polarToCartesian = (
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number,
  ) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  return (
    <svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={createArc(0, angle)} fill={color} />
    </svg>
  );
};

export default RadarProgress;
