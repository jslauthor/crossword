import { ProgressEnum } from 'components/svg/PreviewCube';
import { getAltForType, getIconForType } from 'lib/utils/puzzle';
import Image from 'next/image';
import React from 'react';
import PuzzleProgress from 'components/composed/PuzzleProgress';
import styled from 'styled-components';
import { CrosscubeType } from 'types/types';

const ProgressContainer = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

interface PuzzleIconProps {
  type: CrosscubeType;
  previewState?: ProgressEnum;
}

const PuzzleIcon: React.FC<PuzzleIconProps> = ({
  previewState = ProgressEnum.ZeroPercent,
  type,
}) => {
  return (
    <div className="relative h-full w-full aspect-square">
      <Image
        alt={getAltForType(type)}
        src={getIconForType(type)}
        objectFit="cover"
        fill
        className="rounded-[8px] aspect-square"
      />
      {previewState !== ProgressEnum.ZeroPercent && (
        <ProgressContainer>
          <PuzzleProgress progress={previewState} type={type} />
        </ProgressContainer>
      )}
    </div>
  );
};

export default PuzzleIcon;
