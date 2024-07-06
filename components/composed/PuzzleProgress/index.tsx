import { useMemo } from 'react';
import styled from 'styled-components';
import { ProgressEnum } from 'components/svg/PreviewCube';
import PieChart from 'components/core/PieChart';
import Image from 'next/image';
import { CrosscubeType } from 'types/types';

const Background = styled.div<{ $type: CrosscubeType; $success: boolean }>`
  color: var(--white);
  ${({ $type, $success }) => {
    if ($success === true) {
      return `background: hsl(var(--bg-success));`;
    }
    switch ($type) {
      case 'moji':
        return `background: var(--bg-${$type});`;
      default:
        return `background: hsl(var(--text-${$type}));`;
    }
  }};
`;

const PuzzleProgress: React.FC<{
  progress: ProgressEnum;
  type: CrosscubeType;
}> = ({ progress, type }) => {
  const value = useMemo(() => {
    switch (progress) {
      case ProgressEnum.ZeroPercent:
        return 0.1;
      case ProgressEnum.TwentyFivePercent:
        return 0.15;
      case ProgressEnum.SeventyFivePercent:
        return 0.65;
      case ProgressEnum.Solved:
        return 1;
      default:
        return 0;
    }
  }, [progress]);
  return (
    <Background
      $type={type}
      $success={progress === ProgressEnum.Solved}
      className="rounded-full overflow-hidden w-4 h-4 absolute w-8 h-8 drop-shadow flex justify-center items-center"
    >
      {progress != ProgressEnum.Solved && (
        <PieChart progress={value} size={26} />
      )}
      {progress === ProgressEnum.Solved && (
        <Image
          alt="star"
          src="/noto/svg/emoji_u2b50.svg"
          width={24}
          height={24}
        />
      )}
    </Background>
  );
};

export default PuzzleProgress;
