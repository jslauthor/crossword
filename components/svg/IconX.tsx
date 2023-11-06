import React from 'react';
import { SvgProps } from 'types/types';

const IconX: React.FC<SvgProps> = ({
  width = 16,
  height = 16,
  color = 'var(--primary-text)',
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g clipPath="url(#clip0_633_4561)">
        <path
          d="M2.76404 15.719L15.7978 2.69656C16.0787 2.41566 16.0674 1.96622 15.7978 1.68532L14.5169 0.404424C14.236 0.123525 13.7865 0.123525 13.5056 0.404424L0.471909 13.4269C0.19101 13.7078 0.202246 14.1572 0.471909 14.4381L1.75281 15.719C2.03371 15.9999 2.48314 15.9999 2.76404 15.719ZM0.202246 2.57296L13.2247 15.5954C13.5056 15.8763 13.9551 15.8651 14.236 15.5954L15.5169 14.3145C15.7978 14.0336 15.7978 13.5842 15.5169 13.3033L2.50562 0.269593C2.22472 -0.0113064 1.77528 -7.0408e-05 1.49438 0.269593L0.213482 1.56173C-0.0674171 1.84263 -0.0674171 2.29206 0.213482 2.57296H0.202246Z"
          fill={color}
        />
      </g>
      <defs>
        <clipPath id="clip0_633_4561">
          <rect
            width="16"
            height="15.8652"
            fill={color}
            transform="translate(0 0.0673828)"
          />
        </clipPath>
      </defs>
    </svg>
  );
};

export default IconX;
