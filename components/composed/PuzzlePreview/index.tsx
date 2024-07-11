'use client';

import { useMemo } from 'react';
import { styled } from 'styled-components';
import { ProgressEnum } from 'components/svg/PreviewCube';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import PuzzleIcon from 'components/composed/PuzzleIcon';
import { CrosscubeType } from 'types/types';
import { formatDate } from 'lib/utils/date';

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
  authors: string[];
  date: string;
  puzzleLabel: string[];
  previewState: ProgressEnum;
}

const PuzzlePreview: React.FC<PuzzlePreviewProps> = ({
  type,
  authors = [''],
  date = '',
  title = '',
  puzzleLabel,
  previewState = ProgressEnum.ZeroPercent,
}) => {
  const formattedAuthors = useMemo(() => authors[0], [authors]);

  const formattedLabel = useMemo(() => {
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

  const formattedDate = useMemo(() => formatDate(date, true), [date]);

  return (
    <Container>
      <PuzzleIcon type={type} previewState={previewState} />
      <div>
        <div>{formattedLabel}</div>
        <div className="font-semibold">{formattedDate}</div>
        <div className="font-semibold text-sm leading-6">
          &ldquo;{title}&rdquo;
        </div>
        <div className="opacity-50 mt-4 text-sm">{formattedAuthors}</div>
      </div>
      <FontAwesomeIcon icon={faChevronRight} size="lg" />
    </Container>
  );
};

export default PuzzlePreview;
