import { Card, CardContent } from 'components/core/ui/card';
import { getPuzzleLabelForType } from 'lib/utils/puzzle';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import PuzzleIcon from 'components/composed/PuzzleIcon';
import { CrosscubeType } from 'types/types';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';

const PuzzleType = styled.h1<{ $isFirst: boolean }>`
  letter-spacing: -1.28px;
  display: inline;
  font-weight: ${({ $isFirst }) => ($isFirst ? '600' : '400')};
  font-style: italic;
  margin: 0;
`;

const Background = styled.div<{ $type: PuzzleLatestCondensedProps['type'] }>`
  border-radius: 12px;
  border: 1px solid hsl(var(--border));

  ${({ $type }) => {
    switch ($type) {
      case 'moji':
        return `background: var(--bg-${$type}); opacity: 0.5;`;
      default:
        return `
          background: hsl(var(--bg-${$type}));
        `;
    }
  }};
`;

interface PuzzleLatestCondensedProps {
  type: CrosscubeType;
}

const PuzzleLatestCondensed: React.FC<PuzzleLatestCondensedProps> = ({
  type = 'moji',
}) => {
  const puzzleLabel = useMemo(() => {
    return getPuzzleLabelForType(type);
  }, [type]);

  const formattedLabel = useMemo(() => {
    return puzzleLabel.map((label, index) => (
      <PuzzleType $isFirst={index === 0} key={index}>
        {`${label}`}{' '}
      </PuzzleType>
    ));
  }, [puzzleLabel]);

  return (
    <Link href={`/crosscube/latest/${type}`} className="w-full">
      <Card className="relative rounded-xl overflow-hidden flex flex-col justify-center items-center w-full">
        <Background $type={type} className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 w-full h-full backdrop-blur-xl scale-95" />
        <CardContent className="p-3 relative w-full h-full flex flex-row gap-6 justify-between items-center">
          <div className="flex flex-row gap-6 items-center">
            <div className="w-[44px] h-[44px] relative">
              <PuzzleIcon type={type} />
            </div>
            <div className="flex flex-col gap-0 items-start justify-center">
              <div>Play the latest</div>
              <div>{formattedLabel}</div>
            </div>
          </div>
          <ChevronRight className="text-foreground h-5 w-5" />
        </CardContent>
      </Card>
    </Link>
  );
};

export default PuzzleLatestCondensed;
