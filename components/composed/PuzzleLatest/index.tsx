import { Card, CardContent } from 'components/core/ui/card';
import { PuzzleStats } from 'lib/utils/puzzle';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import Image from 'next/image';
import { Badge } from 'components/core/ui/badge';
import { formatDate, formatTime } from 'lib/utils/date';
import { Button } from 'components/core/ui/button';
import { ProgressEnum } from 'components/svg/PreviewCube';
import PuzzleIcon from 'components/composed/PuzzleIcon';
import { CrosscubeType } from 'types/types';

const PuzzleType = styled.h1<{ $isFirst: boolean }>`
  font-size: 2rem;
  line-height: 1.5rem;
  letter-spacing: -1.28px;
  display: inline;
  font-weight: ${({ $isFirst }) => ($isFirst ? '600' : '400')};
  font-style: italic;
  margin: 0;
`;

const Background = styled.div<{ $type: PuzzleLatestProps['type'] }>`
  ${({ $type }) => {
    switch ($type) {
      case 'moji':
        return `background: var(--bg-${$type}); opacity: 0.6;`;
      default:
        return `background: hsl(var(--bg-${$type}));`;
    }
  }};
`;

interface PuzzleLatestProps {
  type: CrosscubeType;
  title: string;
  authors: string[];
  date: string;
  puzzleLabel: string[];
  puzzleStats: PuzzleStats;
  previewState: ProgressEnum;
}

const PuzzleLatest: React.FC<PuzzleLatestProps> = ({
  type = 'moji',
  title,
  date,
  authors = [''],
  puzzleLabel,
  puzzleStats,
  previewState = ProgressEnum.ZeroPercent,
}) => {
  const formattedAuthors = useMemo(() => authors[0], [authors]);

  const formattedLabel = useMemo(() => {
    return puzzleLabel.map((label, index) => (
      <PuzzleType $isFirst={index === 0} key={index}>
        {`${label}`}{' '}
      </PuzzleType>
    ));
  }, [puzzleLabel]);

  const formattedDate = useMemo(() => formatDate(date), [date]);

  return (
    <Card className="relative rounded-xl overflow-hidden md:min-h-[600px] flex flex-col justify-center items-center">
      <Background $type={type} className="absolute inset-0 w-full h-full" />
      <div className="absolute inset-0 w-full h-full backdrop-blur-xl scale-95" />
      <CardContent className="p-14 relative w-full h-full flex flex-col gap-6 justify-center items-center">
        <PuzzleIcon type={type} previewState={previewState} />
        <div className="flex flex-col gap-4 items-center justify-center">
          <div>{formattedLabel}</div>
          <div className="text-lg">&ldquo;{title}&rdquo;</div>
        </div>
        <div className="flex flex-col items-center gap-0">
          <span className="font-medium text-base">{formattedDate}</span>
          <span className="text-base">
            by <span className="capitalize text-base">{formattedAuthors}</span>
          </span>
        </div>
        <Button variant="inverted" size="share" className="w-40">
          Play
        </Button>
        <Badge
          size="large"
          className="text-auto border-foreground/10 border-solid bg-foreground/[3%] hover:bg-foreground/20"
        >
          <div className="flex flex-row items-center mr-2">
            <Image
              src="/noto/svg/emoji_u23f1.svg"
              alt="clock"
              width={16}
              height={16}
              className="mr-1"
            />
            <div className="font-medium">
              {formatTime(puzzleStats.goalTime)}
            </div>
          </div>
          <div className="flex flex-row items-center">
            <Image
              src="/noto/svg/emoji_u1f7e6.svg"
              alt="blue square"
              width={16}
              height={16}
              className="mr-1"
            />
            <div className="font-medium">{puzzleStats.goalGuesses}</div>
          </div>
        </Badge>
      </CardContent>
    </Card>
  );
};

export default PuzzleLatest;
