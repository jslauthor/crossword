'use client';

import * as React from 'react';
import { styled } from 'styled-components';
import { CrosscubeType, getAltForType, getIconForType } from 'lib/utils/puzzle';
import Image from 'next/image';
import { ProgressEnum } from 'components/svg/PreviewCube';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';

const Container = styled.div`
  position: relative;
  display: grid;
  grid-template-columns: max-content 1fr min-content;
  align-items: center;
  gap: 1.25rem;
  background-color: hsl(var(--background));
`;

const PuzzleType = styled.div<{ $isFirst: boolean; $type: CrosscubeType }>`
  display: inline;
  font-weight: ${({ $isFirst }) => ($isFirst ? '600' : '400')};
  font-style: italic;
  margin: 0;
  line-height: normal;
  ${({ $type }) => `color: hsl(var(--text-${$type}));`};
`;

export interface PuzzlePreviewProps {
  type: CrosscubeType;
  title: string;
  author: string;
  date: string;
  puzzleLabel: string[];
  previewState: ProgressEnum;
}

const PuzzlePreview: React.FC<PuzzlePreviewProps> = ({
  type,
  author = '',
  date = '',
  puzzleLabel,
  previewState = ProgressEnum.ZeroPercent,
}) => {
  const formattedLabel = React.useMemo(() => {
    return puzzleLabel.map((label, index) => (
      <PuzzleType
        className="capitalize"
        $isFirst={index === 0}
        $type={type}
        key={index}
      >
        {`${label}`}{' '}
      </PuzzleType>
    ));
  }, [puzzleLabel, type]);

  return (
    <Container>
      <Image
        alt={getAltForType(type)}
        src={getIconForType(type)}
        width={64}
        height={64}
        className="rounded-[8px]"
      />
      <div>
        <div>{formattedLabel}</div>
        <div className="font-semibold">{date}</div>
        <div className="opacity-50 mt-4 text-sm">{author}</div>
      </div>
      <FontAwesomeIcon icon={faChevronRight} size="lg" />
    </Container>
  );
};

export default PuzzlePreview;
