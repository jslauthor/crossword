import { ProgressEnum } from 'components/svg/PreviewCube';
import { CrosscubeType, getAltForType, getIconForType } from 'lib/utils/puzzle';
import Image from 'next/image';
import React from 'react';
import PuzzleProgress from 'components/composed/PuzzleProgress';
import styled from 'styled-components';

const ProgressContainer = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
`;

interface PuzzleIconProps {
  type: CrosscubeType;
  previewState: ProgressEnum;
}

const PuzzleIcon: React.FC<PuzzleIconProps> = ({ previewState, type }) => {
  return (
    <div className="relative">
      <Image
        alt={getAltForType(type)}
        src={getIconForType(type)}
        width={64}
        height={64}
        className="rounded-[8px]"
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
