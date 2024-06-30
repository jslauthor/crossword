'use client';

import Overlay, { OverlayProps } from 'components/core/Overlay';
import ShareButton from 'components/core/ShareButton';
import React, { ReactNode, useMemo } from 'react';
import styled from 'styled-components';
import { formatTime } from 'lib/utils/date';
import { HRule } from 'components/core/Dividers';
import Image from 'next/image';
import { PuzzleStats } from 'lib/utils/puzzle';

const StarsContainer = styled.div`
  font-size: 5rem;
  display: flex;
`;

const SettingsContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem;
  padding-top: 2rem;
  justify-content: center;
  align-items: center;
`;

const SettingsTitle = styled.h3`
  font-size: 2.25rem;
  font-weight: 600;
  font-style: italic;
  margin: 1rem 0;
`;

const SettingsItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1.125rem;
  font-size: 1.5rem;
  line-height: 1.5rem;
  width: 100%;
`;

const OpacityContainer = styled.div<{ success: boolean }>`
  opacity: ${({ success }) => (success ? '100' : '50')}%;
`;

const ShareTitle = styled.h3`
  font-weight: 500;
  font-style: italic;
`;

const SubLabel = styled.div<{ success: boolean }>`
  color: ${({ success }) =>
    success ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'};
  font-size: 0.75rem;
  font-weight: 500;
`;

const OutlineImage = styled(Image)<{ dim?: boolean }>`
  opacity: ${({ dim }) => (dim ? '50' : '100')}%;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.5));
`;

const Star = ({ width = 90, height = 90, dim = false }) => (
  <OutlineImage
    src="/noto/svg/emoji_u2b50.svg"
    alt="star"
    width={width}
    height={height}
    dim={dim}
  />
);

const Wrong = ({ width = 90, height = 90, dim = false }) => (
  <OutlineImage
    src="/noto/svg/emoji_u274c.svg"
    alt="wrong"
    width={width}
    height={height}
    dim={dim}
  />
);

const ShareItem: React.FC<{
  icon: ReactNode;
  label: ReactNode;
  subLabel?: ReactNode;
  success: boolean;
}> = ({ icon, label, success, subLabel }) => {
  return (
    <SettingsItem>
      <div className="flex flex-row gap-2">
        {icon}
        <div className="flex flex-row gap-4 align-center">
          <ShareTitle>{label}</ShareTitle>
          <SubLabel success={success}>{subLabel}</SubLabel>
        </div>
      </div>
      <OpacityContainer success={success}>
        {success ? (
          <Star width={20} height={20} />
        ) : (
          <Wrong width={20} height={20} dim />
        )}
      </OpacityContainer>
    </SettingsItem>
  );
};

interface PuzzleShareProps extends Partial<OverlayProps> {
  puzzleLabel: string;
  puzzleSubLabel: string;
  puzzleStats: PuzzleStats;
}

const noop = () => {};

const PuzzleShare: React.FC<PuzzleShareProps> = ({
  title = 'Share',
  isOpen = false,
  puzzleLabel,
  puzzleSubLabel,
  onClose = noop,
  puzzleStats,
}) => {
  const numStars = useMemo(() => {
    const { timeSuccess, guessSuccess, hintSuccess } = puzzleStats;
    return [timeSuccess, guessSuccess, hintSuccess].reduce((acc, val) => {
      return acc + (val ? 1 : 0);
    }, 0);
  }, [puzzleStats]);

  const stars = useMemo(() => {
    const val: ReactNode[] = [];
    for (let i = 0; i < numStars + 1; i++) {
      val.push(<Star />);
    }
    return val;
  }, [numStars]);

  const message = useMemo(() => {
    if (numStars === 3) {
      return 'Excellent!';
    } else if (numStars === 2) {
      return 'Great!';
    } else if (numStars === 1) {
      return 'Good Work!';
    } else {
      return 'Finished!';
    }
  }, [numStars]);

  return (
    <Overlay title={title} onClose={onClose} isOpen={isOpen}>
      <SettingsContainer>
        <StarsContainer>{stars}</StarsContainer>
        <SettingsTitle>{message}</SettingsTitle>
        <ShareItem
          icon={
            <Image
              src="/noto/svg/emoji_u2705.svg"
              alt="check"
              width={25}
              height={25}
            />
          }
          label="Finished"
          success={true}
        />
        <HRule />
        <ShareItem
          icon={
            <Image
              src="/noto/svg/emoji_u23f1.svg"
              alt="check"
              width={25}
              height={25}
            />
          }
          label={formatTime(puzzleStats.time)}
          subLabel={
            puzzleStats.timeSuccess
              ? 'Perfect!'
              : `> ${formatTime(puzzleStats.goalTime)}`
          }
          success={puzzleStats.timeSuccess === true}
        />
        <HRule />
        <ShareItem
          icon={
            <Image
              src="/noto/svg/emoji_u1f7e6.svg"
              alt="check"
              width={25}
              height={25}
            />
          }
          label={`${puzzleStats.guesses > 0 ? puzzleStats.guesses : 'No'} guesses`}
          subLabel={
            puzzleStats.guessSuccess
              ? 'Perfect!'
              : `> ${puzzleStats.goalGuesses}`
          }
          success={puzzleStats.guessSuccess === true}
        />
        <HRule />
        <ShareItem
          icon={
            <Image
              src="/noto/svg/emoji_u1f6df.svg"
              alt="check"
              width={25}
              height={25}
            />
          }
          label={puzzleStats.hintSuccess ? 'No hints' : 'Autocheck used'}
          success={puzzleStats.hintSuccess}
        />
        <HRule />
        <ShareButton onClick={noop} />
      </SettingsContainer>
    </Overlay>
  );
};

export default PuzzleShare;
