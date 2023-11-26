'use client';

import React, { useEffect, useState } from 'react';
import { SvgProps } from 'types/types';
import { getColorHex } from 'lib/utils/color';

const twentyFivePercentIndices = [5, 8, 11, 15, 12, 13, 14, 18];
const seventyFivePercentIndices = [
  ...twentyFivePercentIndices,
  3,
  6,
  0,
  9,
  10,
  7,
  17,
  20,
  21,
  22,
  23,
];

export enum ProgressEnum {
  ZeroPercent,
  TwentyFivePercent,
  SeventyFivePercent,
  Solved,
}

interface PreviewCubeProps extends Omit<SvgProps, 'color'> {
  colors?: [number, number, number];
  progress?: ProgressEnum;
}

const getArrayforProgress = (
  progress: ProgressEnum,
  colors: [number, number, number],
) => {
  switch (progress) {
    case ProgressEnum.ZeroPercent:
      return Array.from({ length: 24 }, (_, i) => getColorHex(colors[0]));
    case ProgressEnum.TwentyFivePercent:
      return Array.from({ length: 24 }, (_, i) => {
        const index = twentyFivePercentIndices.includes(i) ? 1 : 0;
        return getColorHex(colors[index]);
      });
    case ProgressEnum.SeventyFivePercent:
      return Array.from({ length: 24 }, (_, i) => {
        const index = seventyFivePercentIndices.includes(i) ? 1 : 0;
        return getColorHex(colors[index]);
      });
    case ProgressEnum.Solved:
      return Array.from({ length: 24 }, () => getColorHex(colors[2]));
    default:
      return Array.from({ length: 24 }, () => getColorHex(colors[0]));
  }
};

const PreviewCube: React.FC<PreviewCubeProps> = ({
  width = 65,
  height = 54,
  colors = [0x829b9e, 0x1fbe68, 0xd1a227],
  progress = ProgressEnum.ZeroPercent,
}) => {
  const [colorsHexValues, setColorHexValues] = useState(
    getArrayforProgress(progress, colors),
  );

  useEffect(() => {
    setColorHexValues(getArrayforProgress(progress, colors));
  }, [colors, progress]);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 65 54`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M0 6.92067L32.005 0V53.8439L0 46.9232V6.92067Z" fill="#100F0F" />
      <path
        d="M0.656982 36.7177L6.54029 37.3351V47.1604L0.656982 45.9551V36.7177Z"
        fill={colorsHexValues[0]}
      />
      <path
        d="M0.656982 27.1047L6.54029 27.1196V36.9399L0.656982 36.3471V27.1047Z"
        fill={colorsHexValues[1]}
      />
      <path
        d="M0.656982 17.4968L6.54029 16.904V26.7243L0.656982 26.7391V17.4968Z"
        fill={colorsHexValues[2]}
      />
      <path
        d="M6.79224 37.3597L13.5005 38.0661V48.578L6.79224 47.2097V37.3597Z"
        fill={colorsHexValues[3]}
      />
      <path
        d="M6.79224 27.1195L13.5005 27.1343V37.6462L6.79224 36.9695V27.1195Z"
        fill={colorsHexValues[4]}
      />
      <path
        d="M6.79224 6.63407L13.5005 5.26575V15.7777L6.79224 16.484V6.63407Z"
        fill={colorsHexValues[5]}
      />
      <path
        d="M13.787 38.0958L21.5128 38.9109V50.2181L13.787 48.6374V38.0958Z"
        fill={colorsHexValues[6]}
      />
      <path
        d="M13.787 16.168L21.5128 15.3875V26.6947L13.787 26.7095V16.168Z"
        fill={colorsHexValues[7]}
      />
      <path
        d="M13.787 5.20659L21.5128 3.62585V14.9331L13.787 15.7481V5.20659Z"
        fill={colorsHexValues[8]}
      />
      <path
        d="M21.8438 27.1492L30.8342 27.1689V39.3999L21.8438 38.491V27.1492Z"
        fill={colorsHexValues[9]}
      />
      <path
        d="M21.8438 15.353L30.8342 14.444V26.675L21.8438 26.6947V15.353Z"
        fill={colorsHexValues[10]}
      />
      <path
        d="M21.8438 3.55667L30.8342 1.724V13.955L21.8438 14.8985V3.55667Z"
        fill={colorsHexValues[11]}
      />
      <path
        d="M64.1039 46.9232L32.0989 53.8439V0L64.1039 6.92067V46.9232Z"
        fill="#100F0F"
      />
      <path
        d="M63.4469 45.9551L57.5636 47.1604V37.3351L63.4469 36.7177V45.9551Z"
        fill={colorsHexValues[12]}
      />
      <path
        d="M63.4469 36.3471L57.5636 36.9399V27.1196L63.4469 27.1047V36.3471Z"
        fill={colorsHexValues[13]}
      />
      <path
        d="M63.4469 26.7391L57.5636 26.7243V16.904L63.4469 17.4968V26.7391Z"
        fill={colorsHexValues[14]}
      />
      <path
        d="M57.3166 47.2097L50.6083 48.578V38.0661L57.3166 37.3597V47.2097Z"
        fill={colorsHexValues[15]}
      />
      <path
        d="M57.3166 36.9695L50.6083 37.6462V27.1343L57.3166 27.1195V36.9695Z"
        fill={colorsHexValues[16]}
      />
      <path
        d="M57.3166 16.484L50.6083 15.7777V5.26575L57.3166 6.63407V16.484Z"
        fill={colorsHexValues[17]}
      />
      <path
        d="M50.3169 48.6374L42.596 50.2181V38.9109L50.3169 38.0958V48.6374Z"
        fill={colorsHexValues[18]}
      />
      <path
        d="M50.3169 26.7095L42.596 26.6947V15.3875L50.3169 16.168V26.7095Z"
        fill={colorsHexValues[19]}
      />
      <path
        d="M50.3169 15.7481L42.596 14.9331V3.62585L50.3169 5.20659V15.7481Z"
        fill={colorsHexValues[20]}
      />
      <path
        d="M42.26 38.491L33.2745 39.3999V27.1689L42.26 27.1492V38.491Z"
        fill={colorsHexValues[21]}
      />
      <path
        d="M42.26 26.6947L33.2745 26.675V14.444L42.26 15.353V26.6947Z"
        fill={colorsHexValues[22]}
      />
      <path
        d="M42.26 14.8985L33.2745 13.955V1.724L42.26 3.55667V14.8985Z"
        fill={colorsHexValues[23]}
      />
      <path
        d="M64.1039 46.9232L32.0989 53.8439V0L64.1039 6.92067V46.9232Z"
        fill="#100F0F"
        fillOpacity="0.5"
      />
    </svg>
  );
};

export default PreviewCube;
