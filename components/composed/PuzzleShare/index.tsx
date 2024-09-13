'use client';

import Overlay, { OverlayProps } from 'components/core/Overlay';
import ShareButton from 'components/core/ShareButton';
import React, { ReactNode, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { formatTime } from 'lib/utils/date';
import { HRule } from 'components/core/Dividers';
import Image from 'next/image';
import { PuzzleStats } from 'lib/utils/puzzle';
import SaveProgressCard, { SaveProgressCardProps } from '../SaveProgressCard';
import GetUpdatesCard from '../GetUpdatesCard';
import { useUser } from '@clerk/nextjs';
import { useUserConfigStore } from 'lib/providers/user-config-provider';
import { CrosscubeType } from 'types/types';
import PuzzleLatestCondensed from '../PuzzleLatestCondensed';

const StarsContainer = styled.div`
  font-size: 5rem;
  display: flex;
  gap: 1rem;
`;

const Container = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
  padding-top: 2rem;
  padding-bottom: 4rem;
  justify-content: center;
  align-items: center;
`;

const SettingsTitle = styled.h3`
  font-size: 2rem;
  font-weight: 500;
  margin: 0;
`;

const SettingsItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 1rem;
  line-height: 1rem;
  width: 100%;
`;

const OpacityContainer = styled.div<{ $success: boolean }>`
  opacity: ${({ $success }) => ($success ? '100' : '50')}%;
`;

const ShareTitle = styled.h3``;

const SubLabel = styled.div<{ $success: boolean }>`
  color: ${({ $success }) =>
    $success ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'};
  font-size: 0.875rem;
  font-weight: 500;
  font-style: italic;
  line-height: normal;
`;

const OutlineImage = styled(Image)<{ $dim?: boolean }>`
  opacity: ${({ $dim }) => ($dim ? '50' : '100')}%;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.5));
`;

const Star = ({ width = 64, height = 64, dim = false }) => (
  <OutlineImage
    src="/noto/svg/emoji_u2b50.svg"
    alt="star"
    width={width}
    height={height}
    $dim={dim}
  />
);

const Wrong = ({ width = 90, height = 90, dim = false }) => (
  <OutlineImage
    src="/noto/svg/emoji_u274c.svg"
    alt="wrong"
    width={width}
    height={height}
    $dim={dim}
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
      <div className="flex flex-row gap-2 items-center justify-center">
        {icon}
        <div className="flex flex-row gap-2 items-center justify-center">
          <ShareTitle>{label}</ShareTitle>
          <SubLabel $success={success}>{subLabel}</SubLabel>
        </div>
      </div>
      <OpacityContainer $success={success}>
        {success ? (
          <Star width={24} height={24} />
        ) : (
          <Wrong width={24} height={24} dim />
        )}
      </OpacityContainer>
    </SettingsItem>
  );
};

const Title = styled.span<{ $isFirst: boolean }>`
  font-size: 1rem;
  font-weight: ${({ $isFirst }) => ($isFirst ? '600' : '400')};
  font-style: italic;
  margin: 0;
`;

const titleCase = (str: string): string => {
  return str.toLowerCase().replace(/(^|\s)\w/g, (match) => match.toUpperCase());
};

const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Text copied to clipboard');
  } catch (err) {
    console.error('Failed to copy text: ', err);
  }
};

const shareContent = async (text: string, title: string): Promise<void> => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: title,
        text: text,
      });
      console.log('Content shared successfully');
    } catch (err) {
      console.error('Error sharing: ', err);
    }
  } else {
    await copyToClipboard(text);
  }
};

interface PuzzleShareProps extends Partial<OverlayProps> {
  type: CrosscubeType;
  puzzleLabel: string[];
  puzzleSubLabel: string;
  puzzleStats: PuzzleStats;
  onAuthClick?: SaveProgressCardProps['onAuthClick'];
}

const noop = () => {};

const PuzzleShare: React.FC<PuzzleShareProps> = ({
  title = 'Share',
  isOpen = false,
  type,
  puzzleLabel,
  puzzleSubLabel,
  onClose = noop,
  puzzleStats,
  onAuthClick,
}) => {
  const isSubscribed = useUserConfigStore((store) => store.isSubscribed);
  const subcribe = useUserConfigStore((store) => store.subcribe);

  const { isSignedIn } = useUser();

  const numStars = useMemo(() => {
    const { timeSuccess, guessSuccess, hintSuccess } = puzzleStats;
    return [timeSuccess, guessSuccess, hintSuccess].reduce((acc, val) => {
      return acc + (val ? 1 : 0);
    }, 0);
  }, [puzzleStats]);

  const stars = useMemo(() => {
    const val: ReactNode[] = [];
    for (let i = 0; i < numStars + 1; i++) {
      val.push(<Star key={i} />);
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

  const formattedLabel = useMemo(() => {
    return puzzleLabel.map((label, index) => (
      <Title $isFirst={index === 0} key={index}>
        {`${label}`}{' '}
      </Title>
    ));
  }, [puzzleLabel]);

  const handleShare = useCallback(() => {
    const share = async () => {
      const { timeSuccess, guessSuccess, hintSuccess } = puzzleStats;
      const result = `⭐️${timeSuccess ? '⭐️' : '❌'}${guessSuccess ? '⭐️' : '❌'}${hintSuccess ? '⭐️' : '❌'}`;
      const content = `${puzzleLabel.map(titleCase).join(' ')}\n"${puzzleSubLabel}"\n${result}\n✅⏱️🟦🛟`;
      await shareContent(content, 'Share Crosscube!');
    };
    share();
  }, [puzzleLabel, puzzleStats, puzzleSubLabel]);

  return (
    <Overlay title={title} onClose={onClose} isOpen={isOpen}>
      <Container>
        <div className="flex flex-col gap-1 justify-center items-center">
          <div>{formattedLabel}</div>
          <div className="text-sm">&quot;{puzzleSubLabel}&quot;</div>
        </div>
        <div className="flex flex-col justify-center items-center gap-4">
          <StarsContainer>{stars}</StarsContainer>
          <SettingsTitle>{message}</SettingsTitle>
        </div>
        <div className="flex flex-col px-8 gap-2 w-full">
          <ShareItem
            icon={
              <Image
                src="/noto/svg/emoji_u2705.svg"
                alt="check"
                width={24}
                height={24}
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
                alt="clock"
                width={24}
                height={24}
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
                alt="blue square"
                width={24}
                height={24}
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
                alt="buoy"
                width={24}
                height={24}
              />
            }
            label={puzzleStats.hintSuccess ? 'No hints' : 'Autocheck used'}
            success={puzzleStats.hintSuccess}
          />
          <HRule />
        </div>

        <ShareButton onClick={handleShare} />

        <PuzzleLatestCondensed type={type} />

        {isSignedIn === false && <SaveProgressCard onAuthClick={onAuthClick} />}
        {isSignedIn === true && isSubscribed === false && (
          <GetUpdatesCard onSignUp={subcribe} />
        )}
      </Container>
    </Overlay>
  );
};

export default PuzzleShare;
