'use client';

import React, { FunctionComponent } from 'react';

interface ClockProps {
  fill?: string;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

const Clock: FunctionComponent<ClockProps> = ({
  fill = 'currentColor',
  width = 24,
  height = 24,
  className,
}) => {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill={fill}
        d="M11.25 4.75C11.25 4.34375 11.5625 4 12 4C16.4062 4 20 7.59375 20 12C20 16.4375 16.4062 20 12 20C7.5625 20 4 16.4375 4 12C4 10.8438 4.25 9.71875 4.71875 8.6875C4.90625 8.28125 5.125 7.90625 5.375 7.53125C5.65625 7.09375 5.96875 6.71875 6.34375 6.34375C6.625 6.0625 7.09375 6.0625 7.375 6.34375C7.6875 6.65625 7.6875 7.125 7.375 7.40625C7.09375 7.71875 6.84375 8.03125 6.59375 8.34375C6.59375 8.375 6.59375 8.375 6.59375 8.375C5.9375 9.34375 5.53125 10.5 5.5 11.75C5.5 11.8438 5.46875 11.9375 5.46875 12C5.46875 15.5938 8.40625 18.5 11.9688 18.5C15.5625 18.5 18.4688 15.5938 18.4688 12C18.4688 8.6875 15.9688 5.9375 12.7188 5.5625V7.25C12.7188 7.6875 12.4062 8 11.9688 8C11.5625 8 11.2188 7.6875 11.2188 7.25V4.75H11.25ZM8.96875 8.96875C9.25 8.6875 9.71875 8.6875 10 8.96875L12.5 11.4688C12.8125 11.7812 12.8125 12.25 12.5 12.5312C12.2188 12.8438 11.75 12.8438 11.4688 12.5312L8.96875 10.0312C8.65625 9.75 8.65625 9.28125 8.96875 8.96875Z"
      />
    </svg>
  );
};

export default Clock;