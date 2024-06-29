'use client';

import Overlay, { OverlayProps } from 'components/core/Overlay';
import ShareButton from 'components/core/ShareButton';
import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { formatTime } from 'lib/utils/date';
import { HRule } from 'components/core/Dividers';
import Image from 'next/image';

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
        <Star width={20} height={20} />
      </OpacityContainer>
    </SettingsItem>
  );
};

interface PuzzleShareProps extends Partial<OverlayProps> {
  puzzleLabel: string;
  puzzleSubLabel: string;
  time: number;
}

const noop = () => {};

const PuzzleShare: React.FC<PuzzleShareProps> = ({
  title = 'Share',
  isOpen = false,
  puzzleLabel,
  puzzleSubLabel,
  onClose = noop,
  time,
}) => {
  return (
    <Overlay title={title} onClose={onClose} isOpen={isOpen}>
      <SettingsContainer>
        <StarsContainer>
          <Star />
          <Star />
          <Star />
          <Star dim />
        </StarsContainer>
        <SettingsTitle>good work!</SettingsTitle>
        <ShareItem
          icon={
            <Image
              src="/noto/svg/emoji_u2705.svg"
              alt="check"
              width={25}
              height={25}
            />
          }
          label="finished"
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
          label={formatTime(time)}
          subLabel="> 2:45"
          success={false}
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
          label="12 guesses"
          subLabel="Perfect!"
          success={true}
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
          label="no hints"
          subLabel="Perfect!"
          success={true}
        />
        <HRule />
        <ShareButton onClick={noop} />
      </SettingsContainer>
    </Overlay>
  );
};

export default PuzzleShare;
