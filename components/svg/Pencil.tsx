'use client';

import React, { FunctionComponent } from 'react';

interface PencilProps {
  fill?: string;
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

const Pencil: FunctionComponent<PencilProps> = ({
  fill = 'currentColor',
  width = 22,
  height = 18,
  className,
}) => {
  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 98 122.5"
      fill={fill}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill={fill}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M90.3139496,22.0563831l-6.7398148,6.7400875L69.2038651,14.4258461l6.7400436-6.740087  c1.3956833-1.3943849,3.6637802-1.3933973,5.0579834,0l9.3120575,9.3124619  C91.7083817,18.3926506,91.7083817,20.6622219,90.3139496,22.0563831z M15.4348841,69.1468582L6.6402287,91.3596573  l22.2126179-8.7942505c-1.3051949-2.958931-3.1373997-5.6272278-5.4642467-7.9536667  C21.0615292,72.2848892,18.3933678,70.4520111,15.4348841,69.1468582z M18.3633842,65.2663269  c3.0959244,1.5013504,5.9080791,3.5017395,8.3883476,5.9822769c2.4803123,2.479866,4.4809284,5.2924728,5.9819183,8.3883514  l47.4774857-47.477623L65.8409576,17.7887077L18.3633842,65.2663269z"
      />
    </svg>
  );
};

export default Pencil;
