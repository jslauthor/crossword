import React, { FunctionComponent } from 'react';
import { SvgProps } from 'types/types';

const NAME = 'icon-hamburger';

const IconHamburger: FunctionComponent<SvgProps> = ({
  width = 18,
  height = 16,
  color = 'var(--primary-text)',
}) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 18 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0.641053 2.93878H17.3084C17.6625 2.93878 17.9495 2.64641 17.9495 2.28571V0.653061C17.9495 0.292367 17.6625 0 17.3084 0H0.641053C0.286992 0 0 0.292367 0 0.653061V2.28571C0 2.64641 0.286992 2.93878 0.641053 2.93878ZM0.641053 9.46939H17.3084C17.6625 9.46939 17.9495 9.17702 17.9495 8.81633V7.18367C17.9495 6.82298 17.6625 6.53061 17.3084 6.53061H0.641053C0.286992 6.53061 0 6.82298 0 7.18367V8.81633C0 9.17702 0.286992 9.46939 0.641053 9.46939ZM0.641053 16H17.3084C17.6625 16 17.9495 15.7076 17.9495 15.3469V13.7143C17.9495 13.3536 17.6625 13.0612 17.3084 13.0612H0.641053C0.286992 13.0612 0 13.3536 0 13.7143V15.3469C0 15.7076 0.286992 16 0.641053 16Z"
        fill={color}
      />
    </svg>
  );
};

export default IconHamburger;
